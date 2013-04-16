(function (context) {

// Dependencies
// ------------
var _       = require("underscore"),
    bean    = require("bean");


// Constants
// ---------
var GLOBAL_VAR          = "_bd_dom",
    BD_QUEUE            = "_bdq",
    BD_EVENT_NAME       = "$dom_event",
    BD_TRACK_METHOD     = "trackRaw",
    IGNORE_ATTR         = "data-bd-ignore",
    // Event property names
    P_EVENT_NAME        = "$event_name",
    P_TAG_NAME          = "tag_name",
    P_CLASS_NAME        = "class_name",
    P_ID                = "id",
    P_HREF              = "href",
    P_EVENT_TYPE        = "type",
    P_WHICH             = "which",
    P_INNER_TEXT        = "inner_text",
    // Track every occurrence of these events
    QUEUE_EVENTS        = ["click", "keyup", "change", "focus", "submit"],
    // High frequency events (track once per heartbeat)
    TRIGGER_EVENTS      = ["scroll"],
    // Event sanitization
    MAX_TEXT_LENGTH     = 128,
    MAX_PROP_LENGTH     = 1024,
    // Request timeouts
    HEARTBEAT_TIMEOUT   = 3000,
    UNLOAD_TIMEOUT      = 300;


// Namespace for classes
var DomTracker = {};


// Event queue and request manager
DomTracker.Queue = function(options) {
    this.options = opts = options || {};
    this.queue = opts.queue || [];
    this.triggered = opts.triggered || {};
    this.isActive = opts.active || false;
};

_.extend(DomTracker.Queue.prototype, {

    activate: function() {
        this.isActive = true;
        this._heartbeat();
    },

    addEvent: function(event) {
        if (!event instanceof DomTracker.Event) return;
        if (TRIGGER_EVENTS.indexOf(event.type) > -1) {
            this.triggered[event.type] = event;
        } else {
            this.queue.push(event);
        }
    },

    flush: function() {
        if (!this.isActive) return;
        this._flush();
    },

    unload: function() {
        var now;
        this._flush();
        if (this._resumeUnload) {
            // Wait for the last request to be sent
            do {
                now = new Date();
            } while (now.realGetTime() < this._resumeUnload);
        }
    },

    _heartbeat: function() {
        if (!this.isActive) return;
        this._flush();
        clearTimeout(this.heartbeatId);
        this.heartbeatId = setTimeout(
            _.bind(this._heartbeat, this),
            HEARTBEAT_TIMEOUT
        );
    },

    _flush: function() {
        var data = [],
            that = this;
        _(this.queue).each(function(event) {
            if (!event || !event.isTrackable()) return;
            data.push(this._getTrackingData(event));
            if (this.debug) console.log("DOM tracker queued", event.type, this._getTrackingData(event));
        }, this);
        _(this.triggered).each(function(event, type) {
            if (!event || !event.isTrackable()) return;
            data.push(this._getTrackingData(event));
            if (this.debug) console.log("DOM tracker triggered", event.type, this._getTrackingData(event));
        }, this);
        if (!_.isEmpty(data)) {
            this._resumeUnload = (new Date()).realGetTime() + UNLOAD_TIMEOUT;
            context[BD_QUEUE].push([BD_TRACK_METHOD, data, function(resp) {
                if (that.debug) {
                    var success = resp === 1 || resp.status == "ok";
                    console.log("DOM tracker", success ? "success" : "error", resp);
                }
                that._resumeUnload = 0;
            }]);
        }
        this._reset();
    },

    _getTrackingData: function(event) {
        var props = event.getProps();
        props[P_EVENT_NAME] = BD_EVENT_NAME;
        return props;
    },

    _reset: function() {
        this.queue = [];
        this.triggered = {};
    }

});


// Event parser and formatter
DomTracker.Event = function(domEvent, options) {
    this.options = opts = options || {};
    this._event = domEvent;
    this.el = domEvent.target;
    this.type = domEvent.type;
};

_.extend(DomTracker.Event.prototype, {

    getProps: function() {
        var props = {};
        _(this.parse()).each(function(value, prop) {
            if (_.isUndefined(value)) return;
            var sanitized = this.sanitizeProp(prop, value);
            if (_.isEmpty(sanitized)) return;
            props[prop] = sanitized;
        }, this);
        return props;
    },

    isTrackable: function() {
        var type = this.type,
            el = this.el;

        if (!el || !type) return false;
        if (el.type == "password") return false;
        if (el.getAttribute && el.getAttribute(IGNORE_ATTR) !== null) return false;

        if (DomTracker.utils.isEditable(el)) {
            // Ignore key presses on input elements
            if (type.indexOf("key") > -1) return false;
        } else {
            // Ignore focus/blur on non-input elements
            if (type == "focus" || type == "blur") return false;
        }
        return true;
    },

    parse: function() {
        var props = {},
            domEvent = this._event,
            el = this.el;

        // Target element properties
        if (_.isString(el.tagName)) props[P_TAG_NAME] = el.tagName.toLowerCase();
        props[P_CLASS_NAME] = _.isObject(el.className) ? el.className.baseVal : el.className;
        props[P_ID] = el.id;
        props[P_HREF] = el.href;

        var innerText = el.innerText;
        if (_.isString(innerText)) {
            // Trim whitespace
            props[P_INNER_TEXT] = innerText.replace(/^\s+|\s+$/g, "");
        }

        // Event properties
        props[P_EVENT_TYPE] = domEvent.type;
        props[P_WHICH] = domEvent.which || domEvent.button || domEvent.keyCode;

        return props;
    },

    sanitizeProp: function(prop, value) {
        var val = String(value);
        switch (prop) {
            case P_CLASS_NAME:
                if (val.length > MAX_PROP_LENGTH) {
                    // Truncate and remove clipped class
                    val = val.slice(0, MAX_PROP_LENGTH)
                             .split(" ").slice(0, -1).join(" ");
                }
                break;
            case P_INNER_TEXT:
                val = val.slice(0, MAX_TEXT_LENGTH);
                break;
            default:
                val = val.slice(0, MAX_PROP_LENGTH);
                break;
        }
        return val;
    }

});


DomTracker.utils = {

    isEditable: function(el) {
        if (!el) return false;
        if (el.contentEditable && el.contentEditable.toLowerCase() === "true") return true;
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
        return false;
    }

};


// Store reference to getTime for unload handling
Date.prototype.realGetTime = Date.prototype.getTime;


// Initialize and activate library after DOM is loaded
$.domReady(function() {
    // Only allow one instance at a time
    if (context[GLOBAL_VAR] instanceof DomTracker.Queue) return;
    var domTracker = context[GLOBAL_VAR] = new DomTracker.Queue();

    // Track all specified DOM events
    var events = QUEUE_EVENTS.concat(TRIGGER_EVENTS);
    bean.on(context, events.join(" "), function(domEvent) {
        var event = new DomTracker.Event(domEvent);
        domTracker.addEvent(event);
    });

    // Flush event queue before unloading page
    bean.on(context, "beforeunload", function() {
        domTracker.unload();
    });

    // Start the heartbeat
    domTracker.activate();
});


})(this);
