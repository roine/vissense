/**
 * @license
 * Vissense <http://vissense.com/>
 * Copyright 2014 tbk <theborakompanioni+vissense@gmail.com>
 * Available under MIT license <http://opensource.org/licenses/MIT>
 */
;(function(window, undefined) {
  'use strict';

    function _window(element) {
		var doc = element.ownerDocument;
		return 'defaultView' in doc ? doc.defaultView : doc.parentWindow;
	}

    function fireIf (when, callback) {
      return function () {
        if (when()) {
          return callback();
        }
      };
    }

    window.VisSenseUtils = {
        _window : _window,
        fireIf: fireIf
    };

}.call(this, this));