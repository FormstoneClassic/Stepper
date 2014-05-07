;(function ($, window) {
	"use strict";

	/**
	 * @options
	 * @param customClass [string] <''> "Class applied to instance"
	 * @param lables.up [string] <'Up'> "Up arrow label"
	 * @param lables.down [string] <'Down'> "Down arrow label"
	 */
	var options = {
		customClass: "",
		labels: {
			up: "Up",
			down: "Down"
		}
	};

	var pub = {

		/**
		 * @method
		 * @name defaults
		 * @description Sets default plugin options
		 * @param opts [object] <{}> "Options object"
		 * @example $.stepper("defaults", opts);
		 */
		defaults: function(opts) {
			options = $.extend(options, opts || {});
			return $(this);
		},

		/**
		 * @method
		 * @name destroy
		 * @description Removes instance of plugin
		 * @example $(".target").stepper("destroy");
		 */
		destroy: function() {
			return $(this).each(function(i) {
				var data = $(this).data("stepper");

				if (data) {
					// Unbind click events
					data.$stepper.off(".stepper")
								 .find(".stepper-arrow")
								 .remove();

					// Restore DOM
					data.$input.unwrap()
							   .removeClass("stepper-input");
				}
			});
		},

		/**
		 * @method
		 * @name disable
		 * @description Disables target instance
		 * @example $(".target").stepper("disable");
		 */
		disable: function() {
			return $(this).each(function(i) {
				var data = $(this).data("stepper");

				if (data) {
					data.$input.attr("disabled", "disabled");
					data.$stepper.addClass("disabled");
				}
			});
		},

		/**
		 * @method
		 * @name enable
		 * @description Enables target instance
		 * @example $(".target").stepper("enable");
		 */
		enable: function() {
			return $(this).each(function(i) {
				var data = $(this).data("stepper");

				if (data) {
					data.$input.attr("disabled", null);
					data.$stepper.removeClass("disabled");
				}
			});
		}
	};

	/**
	 * @method private
	 * @name _init
	 * @description Initializes plugin
	 * @param opts [object] "Initialization options"
	 */
	function _init(opts) {
		// Local options
		opts = $.extend({}, options, opts || {});

		// Apply to each element
		var $items = $(this);
		for (var i = 0, count = $items.length; i < count; i++) {
			_build($items.eq(i), opts);
		}
		return $items;
	}

	/**
	 * @method private
	 * @name _build
	 * @description Builds each instance
	 * @param $select [jQuery object] "Target jQuery object"
	 * @param opts [object] <{}> "Options object"
	 */
	function _build($input, opts) {
		if (!$input.hasClass("stepper-input")) {
			// EXTEND OPTIONS
			opts = $.extend({}, opts, $input.data("stepper-options"));

			// HTML5 attributes
			var min = parseFloat($input.attr("min")),
				max = parseFloat($input.attr("max")),
				step = parseFloat($input.attr("step")) || 1;

			// Modify DOM
			$input.addClass("stepper-input")
				  .wrap('<div class="stepper ' + opts.customClass + '" />')
				  .after('<span class="stepper-arrow up">' + opts.labels.up + '</span><span class="stepper-arrow down">' + opts.labels.down + '</span>');

			// Store data
			var $stepper = $input.parent(".stepper"),
				data = $.extend({
					$stepper: $stepper,
					$input: $input,
					$arrow: $stepper.find(".stepper-arrow"),
					min: (typeof min !== undefined && !isNaN(min)) ? min : false,
					max: (typeof max !== undefined && !isNaN(max)) ? max : false,
					step: (typeof step !== undefined && !isNaN(step)) ? step : 1,
					timer: null
				}, opts);

			data.digits = _digits(data.step);

			// Check disabled
			if ($input.is(":disabled")) {
				$stepper.addClass("disabled");
			}

			// Bind keyboard events
			$stepper.on("keypress", ".stepper-input", data, _onKeyup);

			// Bind click events
			$stepper.on("touchstart.stepper mousedown.stepper", ".stepper-arrow", data, _onMouseDown)
					.data("stepper", data);
		}
	}

	/**
	 * @method private
	 * @name _onKeyup
	 * @description Handles keypress event on inputs
	 * @param e [object] "Event data"
	 */
	function _onKeyup(e) {
		var data = e.data;

		// If arrow keys
		if (e.keyCode === 38 || e.keyCode === 40) {
			e.preventDefault();

			_step(data, (e.keyCode === 38) ? data.step : -data.step);
		}
	}

	/**
	 * @method private
	 * @name _onMouseDown
	 * @description Handles mousedown event on instance arrows
	 * @param e [object] "Event data"
	 */
	function _onMouseDown(e) {
		e.preventDefault();
		e.stopPropagation();

		// Make sure we reset the states
		_onMouseUp(e);

		var data = e.data;

		if (!data.$input.is(':disabled') && !data.$stepper.hasClass("disabled")) {
			var change = $(e.target).hasClass("up") ? data.step : -data.step;

			data.timer = _startTimer(data.timer, 125, function() {
				_step(data, change, false);
			});
			_step(data, change);

			$("body").on("touchend.stepper mouseup.stepper", data, _onMouseUp);
		}
	}

	/**
	 * @method private
	 * @name _onMouseUp
	 * @description Handles mouseup event on instance arrows
	 * @param e [object] "Event data"
	 */
	function _onMouseUp(e) {
		e.preventDefault();
		e.stopPropagation();

		var data = e.data;

		_clearTimer(data.timer);

		$("body").off(".stepper");
	}

	/**
	 * @method private
	 * @name _step
	 * @description Steps through values
	 * @param e [object] "Event data"
	 * @param change [string] "Change value"
	 */
	function _step(data, change) {
		var originalValue = parseFloat(data.$input.val()),
			value = change;

		if (typeof originalValue === undefined || isNaN(originalValue)) {
			if (data.min !== false) {
				value = data.min;
			} else {
				value = 0;
			}
		} else if (data.min !== false && originalValue < data.min) {
			value = data.min;
		} else {
			value += originalValue;
		}

		var diff = (value - data.min) % data.step;
		if (diff !== 0) {
			value -= diff;
		}

		if (data.min !== false && value < data.min) {
			value = data.min;
		}
		if (data.max !== false && value > data.max) {
			value -= data.step;
		}

		if (value !== originalValue) {
			value = _round(value, data.digits);

			data.$input.val(value)
					   .trigger("change");
		}
	}

	/**
	 * @method private
	 * @name _startTimer
	 * @description Starts an internal timer
	 * @param timer [int] "Timer ID"
	 * @param time [int] "Time until execution"
	 * @param callback [int] "Function to execute"
	 */
	function _startTimer(timer, time, callback) {
		_clearTimer(timer);
		return setInterval(callback, time);
	}

	/**
	 * @method private
	 * @name _clearTimer
	 * @description Clears an internal timer
	 * @param timer [int] "Timer ID"
	 */
	function _clearTimer(timer) {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	/**
	 * @method private
	 * @name _digits
	 * @description Analyzes and returns significant digit count
	 * @param value [float] "Value to analyze"
	 * @return [int] "Number of significant digits"
	 */
	function _digits(value) {
		var test = String(value);
		if (test.indexOf(".") > -1) {
			return test.length - test.indexOf(".") - 1;
		} else {
			return 0;
		}
	}

	/**
	 * @method private
	 * @name _round
	 * @description Rounds a number to a sepcific significant digit count
	 * @param value [float] "Value to round"
	 * @param digits [float] "Digits to round to"
	 * @return [number] "Rounded number"
	 */
	function _round(value, digits) {
		var exp = Math.pow(10, digits);
		return Math.round(value * exp) / exp;
	}

	$.fn.stepper = function(method) {
		if (pub[method]) {
			return pub[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return _init.apply(this, arguments);
		}
		return this;
	};

	$.stepper = function(method) {
		if (method === "defaults") {
			pub.defaults.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	};
})(jQuery, this);
