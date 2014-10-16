/*global VisSense,$,jasmine,describe,it,expect,beforeEach,afterEach,spyOn*/
/**
 * @license
 * Vissense <http://vissense.com/>
 * Copyright 2014 tbk <theborakompanioni+vissense@gmail.com>
 * Available under MIT license <http://opensource.org/licenses/MIT>
 */
describe('VisSense Monitor', function() {
    'use strict';

    //var noop = function() { /*empty*/ };

    // TODO: uncomment this if jasmine supports mocking the Date object natively
    //it('should verify that jasmine mocks the Date object', function () {
    //    expect(jasmine.clock().mockDate).toBeDefined();
    //});

    describe('VisState', function() {

        it('should create all 3 VisState objects', function () {
            expect(VisSense.VisState.hidden(0)).toBeDefined();
            expect(VisSense.VisState.visible(0.1)).toBeDefined();
            expect(VisSense.VisState.fullyvisible(1)).toBeDefined();
        });

    });


    describe('strategies', function() {

        describe('Strategy', function() {
            var strategy;

            beforeEach(function() {
                strategy = new VisSense.VisMon.Strategy();
            });

            it('should throw error on start', function () {
                expect(function() {
                    strategy.start();
                }).toThrow();
            });

            it('should throw error on stop', function () {
                expect(function() {
                    strategy.stop();
                }).toThrow();
            });
        });

        describe('NoopStrategy', function() {
            var strategy;

            beforeEach(function() {
                strategy = new VisSense.VisMon.Strategy.NoopStrategy();
            });

            it('should idle on start()', function () {
                expect(strategy.start({ update: VisSense.Utils.noop })).not.toBeDefined();
            });

            it('should idle on stop()', function () {
                expect(strategy.stop()).not.toBeDefined();
            });
        });

        describe('PollingStrategy', function() {
            var strategy;

            beforeEach(function() {
                strategy = new VisSense.VisMon.Strategy.PollingStrategy();
            });

            it('should return true on start()', function () {
                expect(strategy.start({ update: VisSense.Utils.noop })).toBe(true);
            });

            it('should return true on stop()', function () {
                strategy.start({ update: VisSense.Utils.noop });
                expect(strategy.stop()).toBe(true);
            });
            it('should return false on stop() when not running', function () {
                expect(strategy.stop()).toBe(false);
            });
        });

        describe('EventStrategy', function() {
            var strategy;

            beforeEach(function() {
                strategy = new VisSense.VisMon.Strategy.EventStrategy();
            });

            it('should return true on start()', function () {
                expect(strategy.start({ update: VisSense.Utils.noop })).toBe(true);
            });

            it('should return true on stop()', function () {
                strategy.start({ update: VisSense.Utils.noop });
                expect(strategy.stop()).toBe(true);
            });
            it('should return false on stop() when not running', function () {
                expect(strategy.stop()).toBe(false);
            });
        });

    });

    describe('VisMon', function() {
        var element, visobj;

        beforeEach(function() {
            jasmine.getFixtures().set('<div id="element" style="height: 100px; width: 100px; display: none;"></div>');
            element = $('#element')[0];
            visobj = new VisSense(element);

            jasmine.clock().install();

            //jasmine.clock().mockDate();
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        it('should create VisMon objects', function () {
            var vismon = visobj.monitor();

            var vismon2 = visobj.monitor({
                update : VisSense.Utils.noop,
                hidden : VisSense.Utils.noop,
                visible : VisSense.Utils.noop,
                fullyvisible : VisSense.Utils.noop,
                percentagechange : VisSense.Utils.noop,
                visibilitychange : VisSense.Utils.noop
            });

            expect(vismon).toBeDefined();
            expect(vismon2).toBeDefined();
        });

        it('should update verify that first update() argument is a monitor', function () {
            var config = {
                update : function(monitor) {
                    expect(monitor).toBe(vismon);
                }
            };

            spyOn(config, 'update');

            var vismon = visobj.monitor(config).start();

            expect(config.update.calls.count()).toEqual(1);

            vismon.stop();
        });

        it('should verify that state instances are cached if nothing changes', function () {
            var vismon = visobj.monitor();

            expect(vismon.state()).toEqual({});

            vismon.start();

            var firstState = vismon.state();
            expect(firstState).toEqual({
                code: 0,
                state: 'hidden',
                percentage:0,
                hidden: true,
                visible: false,
                fullyvisible: false,
                previous: {}
            });

            vismon.update();

            var cachedState = vismon.state();
            expect(cachedState.previous).toBeDefined();

            expect(cachedState).toEqual({
                code: 0,
                state: 'hidden',
                percentage:0,
                hidden: true,
                visible: false,
                fullyvisible: false,
                previous: {
                    code: 0,
                    state: 'hidden',
                    percentage:0,
                    hidden: true,
                    visible: false,
                    fullyvisible: false
                }
            });

            vismon.update();

            expect(vismon.state() === cachedState).toBe(true);

            vismon.stop();

        });

        it('start/stop NoopStrategy', function () {
            var config = {
                strategy: new VisSense.VisMon.Strategy.NoopStrategy(),
                update : function() {}
            };

            spyOn(config, 'update');

            var vismon = visobj.monitor(config);

            expect(vismon.state()).toEqual({});
            expect(config.update.calls.count()).toEqual(0);

            vismon.start();

            var firstState = vismon.state();
            expect(firstState).toBeDefined();
            expect(firstState.previous).toEqual({});
            expect(config.update.calls.count()).toEqual(1);

            vismon.update();

            var secondState = vismon.state();
            expect(secondState).toBeDefined();
            expect(secondState.hidden).toBeDefined();
            expect(secondState.previous).not.toEqual({});
            expect(config.update.calls.count()).toEqual(2);

            vismon.stop();

            expect(config.update.calls.count()).toEqual(2);

            vismon.use(new VisSense.VisMon.Strategy.NoopStrategy());

            expect(config.update.calls.count()).toEqual(3);
        });

        it('should return -1 on registering handler for invalid event', function () {
            var vismon = visobj.monitor();

            var handlerId = vismon.on('non-existing-event', null);

            expect(handlerId).toBe(-1);
        });

        describe('Events', function() {

            beforeEach(function() {
                jasmine.getFixtures().set(
                    '<div id="element" style="position: absolute; height: 10px; width: 10px; display: none;"></div>'
                );
                element = $('#element')[0];
                visobj = new VisSense(element);

                jasmine.clock().install();

                //jasmine.clock().mockDate();
            });

            it('should verify event chain initially hidden -> fullyvisible -> visible -> visible -> hidden', function() {
                var config = {
                    strategy: new VisSense.VisMon.Strategy.NoopStrategy(),
                    update : function() {},
                    visible : function() {},
                    fullyvisible : function() {},
                    hidden : function() {},
                    visibilitychange: function() {},
                    percentagechange: function() {}
                };

                spyOn(config, 'update');
                spyOn(config, 'hidden');
                spyOn(config, 'visible');
                spyOn(config, 'fullyvisible');
                spyOn(config, 'visibilitychange');
                spyOn(config, 'percentagechange');

                var vismon = visobj.monitor(config);

                expect(config.update.calls.count()).toEqual(0);
                expect(config.hidden.calls.count()).toEqual(0);
                expect(config.visible.calls.count()).toEqual(0);
                expect(config.fullyvisible.calls.count()).toEqual(0);
                expect(config.visibilitychange.calls.count()).toEqual(0);
                expect(config.percentagechange.calls.count()).toEqual(0);

                vismon.start();

                expect(config.update.calls.count()).toEqual(1);
                expect(config.hidden.calls.count()).toEqual(1);
                expect(config.visible.calls.count()).toEqual(0);
                expect(config.fullyvisible.calls.count()).toEqual(0);
                expect(config.visibilitychange.calls.count()).toEqual(1);
                expect(config.percentagechange.calls.count()).toEqual(1);

                vismon.update();

                expect(config.update.calls.count()).toEqual(2);
                expect(config.hidden.calls.count()).toEqual(1);
                expect(config.visible.calls.count()).toEqual(0);
                expect(config.fullyvisible.calls.count()).toEqual(0);
                expect(config.visibilitychange.calls.count()).toEqual(1);
                expect(config.percentagechange.calls.count()).toEqual(1);

                vismon.update();

                expect(config.update.calls.count()).toEqual(3);
                expect(config.hidden.calls.count()).toEqual(1);
                expect(config.visible.calls.count()).toEqual(0);
                expect(config.fullyvisible.calls.count()).toEqual(0);
                expect(config.visibilitychange.calls.count()).toEqual(1);
                expect(config.percentagechange.calls.count()).toEqual(1);

                element.style.display = 'block'; // set visible

                vismon.update();

                expect(config.update.calls.count()).toEqual(4);
                expect(config.hidden.calls.count()).toEqual(1);
                expect(config.visible.calls.count()).toEqual(1);
                expect(config.fullyvisible.calls.count()).toEqual(1);
                expect(config.visibilitychange.calls.count()).toEqual(2);
                expect(config.percentagechange.calls.count()).toEqual(2);

                element.style.left = '-5px'; // 50% visible

                vismon.update();

                expect(config.update.calls.count()).toEqual(5);
                expect(config.hidden.calls.count()).toEqual(1);
                expect(config.visible.calls.count()).toEqual(1);
                expect(config.fullyvisible.calls.count()).toEqual(1);
                expect(config.visibilitychange.calls.count()).toEqual(3);
                expect(config.percentagechange.calls.count()).toEqual(3);

                element.style.left = '-9px'; // 10% visible

                vismon.update();

                expect(config.update.calls.count()).toEqual(6);
                expect(config.hidden.calls.count()).toEqual(1);
                expect(config.visible.calls.count()).toEqual(1);
                expect(config.fullyvisible.calls.count()).toEqual(1);
                expect(config.visibilitychange.calls.count()).toEqual(3);
                expect(config.percentagechange.calls.count()).toEqual(4);

                element.style.left = '-10px'; // 0% visible

                vismon.update();

                expect(config.update.calls.count()).toEqual(7);
                expect(config.hidden.calls.count()).toEqual(2);
                expect(config.visible.calls.count()).toEqual(1);
                expect(config.fullyvisible.calls.count()).toEqual(1);
                expect(config.visibilitychange.calls.count()).toEqual(4);
                expect(config.percentagechange.calls.count()).toEqual(5);

                vismon.stop();

            });
        });
    });

});