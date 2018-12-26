/**
 * @author Rakesh Samaddar
 * @since 2018-12-26
 * @version 1.0
 * 
 */

/**
 * Builder object with setter methods to build a
 * functional Calendar. Setter methods can be
 * chained. Last method in the chain should be
 * `.build()`. If setter methods aren't specified
 * then calendar is built with default values.
 */
let CalendarBuilder = function () {

    this.config = {
        timeZoneOffset: -330,
        isTimeZoneOffsetSet: false,
        activeDays: {
            0: {
                active: false,
                isIndividuallySet: false
            },
            1: {
                active: true,
                shiftHours: [8, 16],
                shiftMinutes: [0, 0],
                isIndividuallySet: false
            },
            2: {
                active: true,
                shiftHours: [8, 16],
                shiftMinutes: [0, 0],
                isIndividuallySet: false
            },
            3: {
                active: true,
                shiftHours: [8, 16],
                shiftMinutes: [0, 0],
                isIndividuallySet: false
            },
            4: {
                active: true,
                shiftHours: [8, 16],
                shiftMinutes: [0, 0],
                isIndividuallySet: false
            },
            5: {
                active: true,
                shiftHours: [8, 16],
                shiftMinutes: [0, 0],
                isIndividuallySet: false
            },
            6: {
                active: false,
                isIndividuallySet: false
            }
        },
        exceptions: [],
        areDaysSet: false,
        areExceptionsSet: false,
        timePeriod: {
            hoursPerDay: 8,
            hoursPerWeek: 40,
            hoursPerMonth: 160,
            hoursPerYear: 1920
        },
        isTimePeriodSet: false,
        durationUnit: "minute",
        isDurationUnitSet: false,
    };

    /**
     * Sets the time zone offset for the calendar.
     * Negative values indicate that time is ahead
     * of GMT and viceversa. Defaults to the timezone
     * where this module is executed.
     * Time-zone can't be set after exceptions are set
     * @param {number} minutes - Offset from UTC in minutes
     * @returns {CalendarBuilder}
     */
    this.setTimeZoneOffset = function (minutes) {
        if (this.config.areExceptionsSet) throw new Error("Time-zone can't be modified after exceptions are added");
        if (minutes === undefined || minutes === null) {
            this.config.timeZoneOffset = 0;
            this.config.isTimeZoneOffsetSet = false;
            return this;
        }
        let date = new Date();
        this.config.timeZoneOffset = minutes - date.getTimezoneOffset();
        this.config.isTimeZoneOffsetSet = true;
        return this;
    };

    /**
     * Internal method.
     * Sets working hours in a day. If not
     * set, defaults to 8:00 AM to 5:00 PM.
     * @param {number} day
     * @param {object} workTime
     * @param {number[]} workTime.shiftHours
     * @param {number[]} workTime.shiftMinutes
     * @param {boolean} isIndividuallySet
     * @returns {boolean}
     */
    this.__setIndividualWorkTime = function (day, workTime, isIndividuallySet) {
        isIndividuallySet = !!isIndividuallySet;
        if (!isIndividuallySet && this.config.activeDays[day].isIndividuallySet) return true;

        if (arguments.length == 1) return false;
        if (workTime === undefined || workTime === null
            || Number.isNaN(parseInt(day))) return false;

        if (workTime === false) {
            this.config.activeDays[day].active = false;
            this.config.activeDays[day].isIndividuallySet = isIndividuallySet;
            delete this.config.activeDays[day].shiftHours;
            delete this.config.activeDays[day].shiftMinutes;
            return true;
        }

        let shiftHours = [];
        let shiftMinutes = [];
        for (let i = 0; i < workTime.shiftHours.length / 2; i++) {
            let hoursStart = workTime.shiftHours[2 * i];
            let hoursEnd = workTime.shiftHours[2 * i + 1];
            let minsStart, minsEnd;
            try {
                minsStart = workTime.shiftMinutes[2 * i];
            } catch (err) {
                minsStart = 0;
            } finally {
                minsStart = minsStart || 0;
            }
            try {
                minsEnd = workTime.shiftMinutes[2 * i + 1];
            } catch (err) {
                minsEnd = 0;
            } finally {
                minsEnd = minsEnd || 0;
            }
            let currentShiftStartTime = new Date();
            currentShiftStartTime.setHours(hoursStart, minsStart, 0, 0);
            let currentShiftEndTime = new Date();
            currentShiftEndTime.setHours(hoursEnd, minsEnd, 0, 0);
            if (currentShiftStartTime > currentShiftEndTime) {
                console.warn("Shift end time is behind shift start time. Rolling back to previous values");
                return false;
            }
            if (i > 0) {
                let lastShiftEndTime = new Date();
                lastShiftEndTime.setHours(shiftHours[2 * (i - 1) + 1], shiftMinutes[2 * (i - 1) + 1], 0, 0);
                if (lastShiftEndTime > currentShiftStartTime) {
                    console.warn("A later shift has timings behind the previous shift. Rolling back to previous values");
                    return false;
                } else if (+lastShiftEndTime == +currentShiftStartTime) {
                    shiftHours.pop();
                    shiftMinutes.pop();
                    shiftHours.push(hoursEnd);
                    shiftMinutes.push(minsEnd);
                    continue;
                }
            }
            shiftHours.push(hoursStart);
            shiftHours.push(hoursEnd);
            shiftMinutes.push(minsStart);
            shiftMinutes.push(minsEnd);
        }
        if (shiftHours.length && shiftMinutes.length) {
            this.config.activeDays[day].shiftHours = shiftHours;
            this.config.activeDays[day].shiftMinutes = shiftMinutes;
            this.config.activeDays[day].active = true;
            this.config.activeDays[day].isIndividuallySet = isIndividuallySet;
            return true;
        }
        return false;
    };

    /**
     * Sets working hours of all days corresponding
     * to the 
     * @param {object} workTime
     * @param {number[]} workTime.shiftHours
     * @param {number[]} workTime.shiftMinutes
     * @returns {CalendarBuilder}
     */
    this.setDefaultWorkTime = function (workTime) {
        for (let i = 0; i < 7; i++) {
            let oldValue = Object.assign({}, this.config.activeDays[i]);
            if (!this.__setIndividualWorkTime(i, workTime, false)) this.config.activeDays[i] = oldValue;
        }
        this.config.areDaysSet = true;
        return this;
    };

    /**
     * Sets the weekends in a week. Days should be supplied as
     * numbers with Sunday as 0 and Saturday as 6. Parameter can
     * be an array of days or a single day. Default is Saturday
     * and Sunday.
     * @param {number} day
     * @param {object} workTime
     * @param {number[]} workTime.shiftHours
     * @param {number[]} workTime.shiftMinutes
     * @returns {CalendarBuilder}
     */
    this.setIndividualWorkTime = function (day, workTime) {
        let oldValue = Object.assign({}, this.config.activeDays[day]);
        if (!this.__setIndividualWorkTime(day, workTime, true)) this.config.activeDays[day] = oldValue;

        // If all days are individually set, then 'areDaysSet' flag is true
        for (let i = 0; i < 7; i++) {
            if (this.config.activeDays[i].isIndividuallySet === false) return this;
        }
        this.config.areDaysSet = true;
        return this;
    };

    this.setException = function (dateString, workTime) {
        if (arguments.length != 2) {
            console.error("Both arguments are required");
            return this;
        }
        if (workTime === undefined || workTime === null
            || Number.isNaN((new Date(dateString)).valueOf())) {
            console.error("Invalid arguments");
            return this;
        }
        let date = new Date(dateString);
        date.setMinutes(date.getMinutes() - this.config.timeZoneOffset);  // To counter the time-zone problem

        let exception = this.config.exceptions.find(element => {
            return element.date.valueOf() == date.valueOf();
            if (element.date.getFullYear() == date.getFullYear() && element.date.getMonth() == date.getMonth() && element.date.getDate() == date.getDate()) {
                return true;
            } else return false;
        });
        if (workTime === false) {
            if (exception) {
                delete exception.shiftHours;
                delete exception.shiftMinutes;
            } else {
                this.config.exceptions.push({ date: date });
            }
            this.config.areExceptionsSet = true;
            return this;
        }
        let shiftHours = [];
        let shiftMinutes = [];
        for (let i = 0; i < workTime.shiftHours.length / 2; i++) {
            let hoursStart = workTime.shiftHours[2 * i];
            let hoursEnd = workTime.shiftHours[2 * i + 1];
            let minsStart, minsEnd;
            try {
                minsStart = workTime.shiftMinutes[2 * i];
            } catch (err) {
                minsStart = 0;
            } finally {
                minsStart = minsStart || 0;
            }
            try {
                minsEnd = workTime.shiftMinutes[2 * i + 1];
            } catch (err) {
                minsEnd = 0;
            } finally {
                minsEnd = minsEnd || 0;
            }
            let currentShiftStartTime = new Date();
            currentShiftStartTime.setHours(hoursStart, minsStart, 0, 0);
            let currentShiftEndTime = new Date();
            currentShiftEndTime.setHours(hoursEnd, minsEnd, 0, 0);
            if (currentShiftStartTime > currentShiftEndTime) {
                console.warn("Shift end time is behind shift start time. Falling back to default values");
                return this;
            }
            if (i > 0) {
                let lastShiftEndTime = new Date();
                lastShiftEndTime.setHours(shiftHours[2 * (i - 1) + 1], shiftMinutes[2 * (i - 1) + 1], 0, 0);
                if (lastShiftEndTime > currentShiftStartTime) {
                    console.warn("A later shift has timings behind the previous shift. Falling back to default values");
                    return this;
                } else if (+lastShiftEndTime == +currentShiftStartTime) {
                    shiftHours.pop();
                    shiftMinutes.pop();
                    shiftHours.push(hoursEnd);
                    shiftMinutes.push(minsEnd);
                    continue;
                }
            }
            shiftHours.push(hoursStart);
            shiftHours.push(hoursEnd);
            shiftMinutes.push(minsStart);
            shiftMinutes.push(minsEnd);
        }
        if (exception && shiftHours.length && shiftMinutes.length) {
            exception.shiftHours = shiftHours;
            exception.shiftMinutes = shiftMinutes;
            this.config.areExceptionsSet = true;
        } else if (shiftHours.length && shiftMinutes.length) {
            this.config.exceptions.push({
                date: date,
                shiftHours: shiftHours,
                shiftMinutes: shiftMinutes
            })
        }
        return this;
    };

    /**
     * Sets the time period of the Calendar
     * @param {object} settings
     * @param {number} settings.hoursPerDay
     * @param {number} settings.hoursPerWeek
     * @param {number} settings.hoursPerMonth
     * @param {number} settings.hoursPerYear
     * @returns {CalendarBuilder}
     */
    this.setTimePeriod = function (settings) {
        if (settings.hasOwnProperty("hoursPerDay")) this.config.timePeriod.hoursPerDay = parseInt(settings.hoursPerDay);
        if (settings.hasOwnProperty("hoursPerWeek")) this.config.timePeriod.hoursPerWeek = parseInt(settings.hoursPerWeek);
        if (settings.hasOwnProperty("hoursPerMonth")) this.config.timePeriod.hoursPerMonth = parseInt(settings.hoursPerMonth);
        if (settings.hasOwnProperty("hoursPerYear")) this.config.timePeriod.hoursPerYear = parseInt(settings.hoursPerYear);
        this.config.isTimePeriodSet = true;
        return this;
    };

    /**
     * Sets the duration unit of the Calendar
     * Valid units are: day, hour, minute
     * Defaults to minute.
     * @param {String} unit
     * @returns {CalendarBuilder}
     */
    this.setDurationUnit = function (unit) {
        if (unit != "day" && unit != "hour" && unit != "minute"
            && unit != "second" && unit != "millisecond") throw new Error("Duration unit is invalid");
        this.config.durationUnit = unit;
        this.config.isDurationUnitSet = true;
        return this;
    }

    /**
     * Builds a calendar with the setter methods and returns
     * a calendar object.
     * @returns {Calendar}
     */
    this.build = function () {
        return new Calendar(this, this.config);
    };
};

/**
 * Main Calendar API. `__functions` are for internal
 * use. Rest of the methods can be used publicly.
 */
let Calendar = function (CalendarBuilder, config) {
    this.$CalendarBuilder = CalendarBuilder;
    this.config = config;
};

Calendar.prototype = {

    units: [
        "day",
        "hour",
        "minute",
        "second",
        "millisecond"
    ],

    /**
     * Returns false when duration unit is default.
     * @returns {boolean}
     */
    isDurationUnitSet: function () {
        return this.config.isDurationUnitSet;
    },

    /**
     * @returns {number}
     */
    __getConversionFactorToMS: function (unit) {
        if (this.__getUnitOrder(unit) == -1) unit = this.config.durationUnit;
        switch (unit) {
            case "day":
                return this.getTimePeriod().hoursPerDay * 60 * 60 * 1000;
            case "hour":
                return 60 * 60 * 1000;
            case "minute":
                return 60 * 1000;
            case "second":
                return 1000;
            default:
                return 1;
        }
    },

    __getUnitOrder: function (unit) {
        for (var i = 0, len = this.units.length; i < len; i++) {
            if (this.units[i] == unit)
                return i;
        }
        return -1;
    },

    /**
     * Returns false when time zone offset is default.
     * @returns {boolean}
     */
    isTimeZoneOffsetSet: function () {
        return this.config.isTimeZoneOffsetSet;
    },

    /**
     * Fetches time zone offset.
     * @returns {number}
     */
    getTimeZoneOffset: function () {
        let date = new Date();
        return this.config.timeZoneOffset + date.getTimezoneOffset();
    },

    /**
     * Returns false when work hours are default.
     * @returns {boolean}
     */
    isworkTimeSet: function () {
        return this.config.areDaysSet;
    },

    /**
     * Returns false when exceptions are not set.
     * @returns {boolean}
     */
    areExceptionsSet: function () {
        return this.config.areExceptionsSet;
    },

    /**
     * Fetches holidays.
     * @returns {Date[]}
     */
    getExceptions: function () {
        return this.config.exceptions;
    },

    isTimePeriodSet: function () {
        return this.config.isTimePeriodSet;
    },

    getTimePeriod: function () {
        return this.config.timePeriod;
    },

    __isException: function (date) {
        let exception = this.config.exceptions.find(element => {
            if (element.date.getFullYear() == date.getFullYear() && element.date.getMonth() == date.getMonth() && element.date.getDate() == date.getDate()) {
                return true;
            } else return false;
        });
        return exception ? exception : false;
    },

    __getWorkTime: function (date) {
        let shiftHours = [];
        let shiftMinutes = [];
        let shiftDuration = [];
        let breakDuration = [];
        let exception = this.__isException(date);
        if (exception) {
            if (exception.shiftHours) {
                // shiftHours = exception.shiftHours;
                // shiftMinutes = exception.shiftMinutes;
                Object.assign(shiftHours, exception.shiftHours);
                Object.assign(shiftMinutes, exception.shiftMinutes);
            } else return { shiftHours: [], shiftMinutes: [], shiftDuration: [], breakDuration: [] };
        } else {
            if (!this.config.activeDays[date.getDay()].active) {
                return { shiftHours: [], shiftMinutes: [], shiftDuration: [], breakDuration: [] };
            } else {
                // shiftHours = this.config.activeDays[date.getDay()].shiftHours;
                // shiftMinutes = this.config.activeDays[date.getDay()].shiftMinutes;
                Object.assign(shiftHours, this.config.activeDays[date.getDay()].shiftHours);
                Object.assign(shiftMinutes, this.config.activeDays[date.getDay()].shiftMinutes);
            }
        }
        let randomDateStart = new Date();
        let randomDateEnd = new Date(randomDateStart);
        for (let i = 0; i < shiftHours.length / 2; i++) {
            randomDateStart.setHours(shiftHours[2 * i], shiftMinutes[2 * i], 0, 0);
            if (i > 0) {
                breakDuration.push((randomDateStart.valueOf() - randomDateEnd.valueOf()) / (1000 * 60 * 60));
            }
            randomDateEnd.setHours(shiftHours[2 * i + 1], shiftMinutes[2 * i + 1], 0, 0);
            shiftDuration.push((randomDateEnd.valueOf() - randomDateStart.valueOf()) / (1000 * 60 * 60));
        }
        breakDuration.push(0);
        return {
            shiftHours: shiftHours,
            shiftMinutes: shiftMinutes,
            shiftDuration: shiftDuration,
            breakDuration: breakDuration
        };
    },

    /**
     * Fetches working hours.
     * @param {Date} date
     * @returns {object}
     */
    getWorkTime: function (date) {
        let __date = this.__preProcessDates(date);
        return this.__getWorkTime(__date);
    },

    /**
     * Fetches weekends.
     * @returns {number[]}
     */
    getWeekOffs: function () {
        let weekOffs = [];
        for (let i = 0; i < 7; i++) {
            if (!this.config.activeDays[i].active) weekOffs.push(i);
        }
        return weekOffs;
    },

    __preProcessDates: function (date) {
        let __date = new Date(date);
        if (Number.isNaN(__date.valueOf())) {
            let invalidDateError = new Error("Invalid date")
            invalidDateError.name = "InvalidDateError";
            throw invalidDateError;
        }
        __date.setMinutes(__date.getMinutes() - this.config.timeZoneOffset);
        return __date;
    },

    __postProcessDates: function (date) {
        let __date = new Date(date);
        __date.setMinutes(__date.getMinutes() + this.config.timeZoneOffset);
        return __date;
    },

    __isWorkingDay: function (date) {
        let exception = this.__isException(date);
        if (exception && !exception.shiftHours) return false;
        else if (exception && exception.shiftHours) return true;
        if (this.config.activeDays[date.getDay()].active) return true;
        else return false;
    },

    __isWorkTime: function (date) {
        if (!this.__isWorkingDay(date)) return false;
        let workTime = this.__getWorkTime(date);
        // let __date = new Date(date);
        let dateA = new Date(date);
        let dateB = new Date(date);
        dateA.setHours(workTime.shiftHours[0], workTime.shiftMinutes[0], 0, 0);
        dateB.setHours(workTime.shiftHours[workTime.shiftHours.length - 1], workTime.shiftMinutes[workTime.shiftMinutes.length - 1], 0, 0);
        if (+date < +dateA || +date > +dateB) return false;
        for (let i = 1; i < workTime.shiftHours.length / 2; i++) {
            dateA.setHours(workTime.shiftHours[2 * i - 1], workTime.shiftMinutes[2 * i - 1], 0, 0);
            dateB.setHours(workTime.shiftHours[2 * i], workTime.shiftMinutes[2 * i], 0, 0);
            if (+date > +dateA && +date < +dateB) return false;
        }
        return true;
    },

    __getClosestPastWorkDate: function (date) {
        let __date = new Date(date);
        let workTime = this.__getWorkTime(__date);

        if (this.__isWorkingDay(__date)) {
            let dayEndTime = new Date(__date);
            dayEndTime.setHours(workTime.shiftHours[workTime.shiftHours.length - 1], workTime.shiftMinutes[workTime.shiftMinutes.length - 1], 0, 0);
            if (+__date > +dayEndTime) {
                __date.setHours(workTime.shiftHours[workTime.shiftHours.length - 1], workTime.shiftMinutes[workTime.shiftMinutes.length - 1], 0, 0);
                return __date;
            }
            let dayStartTime = new Date(__date);
            dayStartTime.setHours(workTime.shiftHours[0], workTime.shiftMinutes[0], 0, 0);
            if (+__date <= +dayStartTime) {
                __date.setDate(__date.getDate() - 1);
            } else {
                let comparisonPreviousShiftEnd = new Date(__date);
                let comparisonNextShiftStart = new Date(comparisonPreviousShiftEnd);
                for (let i = 1; i < (workTime.shiftHours.length / 2); i++) {
                    comparisonPreviousShiftEnd.setHours(workTime.shiftHours[2 * i - 1], workTime.shiftMinutes[2 * i - 1], 0, 0);
                    comparisonNextShiftStart.setHours(workTime.shiftHours[2 * i], workTime.shiftMinutes[2 * i], 0, 0);
                    if (+__date > +comparisonPreviousShiftEnd && +__date <= +comparisonNextShiftStart) {
                        __date.setHours(comparisonPreviousShiftEnd.getHours(), comparisonPreviousShiftEnd.getMinutes(), 0, 0);
                        break;
                    }
                };
                return __date;
            }
        }

        while (!this.__isWorkingDay(__date)) {
            __date.setDate(__date.getDate() - 1);
        }
        workTime = this.__getWorkTime(__date);
        __date.setHours(workTime.shiftHours[workTime.shiftHours.length - 1], workTime.shiftMinutes[workTime.shiftMinutes.length - 1], 0, 0);
        return __date;
    },

    /**
     * Calculates the closest business date prior to the passed argument.
     * Considers working days and working hours. Most effective when 
     * argument is outside the work hours.
     * @param {Date} date
     * @returns {Date}
     */
    getClosestPastWorkDate: function (date) {
        let __date = this.__preProcessDates(date);
        __date = this.__getClosestPastWorkDate(__date);
        return this.__postProcessDates(__date);
    },

    __getClosestFutureWorkDate: function (date) {
        let __date = new Date(date);
        let workTime = this.__getWorkTime(__date);

        if (this.__isWorkingDay(__date)) {
            let dayStartTime = new Date(__date);
            dayStartTime.setHours(workTime.shiftHours[0], workTime.shiftMinutes[0], 0, 0);
            if (+__date < +dayStartTime) {
                __date.setHours(workTime.shiftHours[0], workTime.shiftMinutes[0], 0, 0);
                return __date;
            }
            let dayEndTime = new Date(__date);
            dayEndTime.setHours(workTime.shiftHours[workTime.shiftHours.length - 1], workTime.shiftMinutes[workTime.shiftMinutes.length - 1], 0, 0);
            if (+__date >= +dayEndTime) {
                __date.setDate(__date.getDate() + 1);
            } else {
                let comparisonPreviousShiftEnd = new Date(__date);
                let comparisonNextShiftStart = new Date(comparisonPreviousShiftEnd);
                for (let i = 1; i < (workTime.shiftHours.length / 2); i++) {
                    comparisonPreviousShiftEnd.setHours(workTime.shiftHours[2 * i - 1], workTime.shiftMinutes[2 * i - 1], 0, 0);
                    comparisonNextShiftStart.setHours(workTime.shiftHours[2 * i], workTime.shiftMinutes[2 * i], 0, 0);
                    if (+__date >= +comparisonPreviousShiftEnd && +__date < +comparisonNextShiftStart) {
                        __date.setHours(comparisonNextShiftStart.getHours(), comparisonNextShiftStart.getMinutes(), 0, 0);
                        break;
                    }
                };
                return __date;
            }
        }

        while (!this.__isWorkingDay(__date)) {
            __date.setDate(__date.getDate() + 1);
        }
        workTime = this.__getWorkTime(__date);
        __date.setHours(workTime.shiftHours[0], workTime.shiftMinutes[0], 0, 0);
        return __date;
    },

    /**
     * Calculates the closest business date at a time later than the
     * provided `date`. Considers working days and working hours.
     * Most effective when argument is outside the work hours.
     * @param {Date} date
     * @returns {Date}
     */
    getClosestFutureWorkDate: function (date) {
        let __date = this.__preProcessDates(date);
        __date = this.__getClosestFutureWorkDate(__date);
        return this.__postProcessDates(__date);
    },

    __calculateDurationFromWorkTimeBoundary: function (date, unit, isFutureDirection) {
        if (isFutureDirection == null || isFutureDirection == undefined) isFutureDirection = true;
        unit = this.__getUnitOrder(unit) == -1 ? this.config.durationUnit : unit;
        if (!this.__isWorkTime(date)) return 0;
        let workTime = this.__getWorkTime(date);
        let dateA = new Date(date);
        let dateB = new Date(date);
        let milliSecsDuration = 0;
        for (let i = 0; i < workTime.shiftHours.length / 2; i++) {
            dateA.setHours(workTime.shiftHours[2 * i], workTime.shiftMinutes[2 * i], 0, 0);
            dateB.setHours(workTime.shiftHours[2 * i + 1], workTime.shiftMinutes[2 * i + 1], 0, 0);
            if (+date >= dateA && +date <= dateB) {
                if (isFutureDirection) milliSecsDuration = dateB.valueOf() - date.valueOf();
                else milliSecsDuration = date.valueOf() - dateA.valueOf();
                break;
            }
        }
        if (unit == "millisecond") return milliSecsDuration;
        if (unit == "second") return milliSecsDuration / 1000;
        if (unit == "minute") return milliSecsDuration / (1000 * 60);
        if (unit == "hour") return milliSecsDuration / (1000 * 60 * 60);
        if (unit == "day") return milliSecsDuration / (1000 * 60 * 60 * this.getTimePeriod().hoursPerDay);
    },

    __getWorkingDate: function (__date, isNext, shouldConsiderworkTime) {
        let __shouldConsiderworkTime = true;    // default
        __date = new Date(__date);

        if (shouldConsiderworkTime !== undefined && shouldConsiderworkTime !== null) {
            __shouldConsiderworkTime = shouldConsiderworkTime;
        }

        if (__shouldConsiderWorkHours) {
            let workHourStartDate = new Date(__date);
            workHourStartDate.setHours(this.config.workHours.DAY_START, this.config.workHours.DAY_START_MINUTES, 0, 0);
            let workHourEndDate = new Date(__date);
            workHourEndDate.setHours(this.config.workHours.DAY_END, this.config.workHours.DAY_END_MINUTES, 0, 0);
            if (+__date < +workHourStartDate || +__date >= +workHourEndDate) {
                if (isNext) __date = this.__getClosestFutureWorkDate(__date);
                else __date = this.__getClosestPastWorkDate(__date);
            }
        }

        do {
            if (isNext) {
                __date.setDate(__date.getDate() + 1);
                if (__shouldConsiderWorkHours) {
                    let tempDate = new Date(__date);
                    tempDate.setHours(this.config.workHours.DAY_START, this.config.workHours.DAY_START_MINUTES, 0, 0);
                    if (+tempDate == +__date) {
                        __date.setDate(__date.getDate() - 1);
                        __date.setHours(this.config.workHours.DAY_END, this.config.workHours.DAY_END_MINUTES, 0, 0);
                    }
                }
            } else {
                __date.setDate(__date.getDate() - 1);
                if (__shouldConsiderWorkHours) {
                    let tempDate = new Date(__date);
                    tempDate.setHours(this.config.workHours.DAY_END, this.config.workHours.DAY_END_MINUTES, 0, 0);
                    if (+tempDate == +__date) {
                        __date.setDate(__date.getDate() + 1);
                        __date.setHours(this.config.workHours.DAY_START, this.config.workHours.DAY_START_MINUTES, 0, 0);
                    }
                }
            }
        } while (!this.__isWorkingDay(__date))

        return __date;
    },

    __calculateEndDate: function (fromDate, duration) {
        let inc = duration > 0 ? 1 : -1;
        let endDate = new Date(fromDate);
        duration = Math.abs(duration);
        let added = 0;
        while (added < duration) {
            let durationFromBoundary = this.__calculateDurationFromWorkTimeBoundary(endDate, this.config.durationUnit, inc == true);
            let multiplyingFactor = this.__getConversionFactorToMS();
            if ((duration - added) <= durationFromBoundary) {
                endDate.setTime(endDate.getTime() + inc * (duration - added) * multiplyingFactor);
                added = duration;
            } else {
                endDate.setTime(endDate.getTime() + inc * durationFromBoundary * multiplyingFactor);
                if (inc == 1) endDate = this.__getClosestFutureWorkDate(endDate);
                else endDate = this.__getClosestPastWorkDate(endDate);
                added += durationFromBoundary;
            }
        }
        return endDate;
    },

    /**
     * Adds or subtracts the provided number of `duration`
     * to or from the `fromDate`.
     * @param {Date} fromDate 
     * @param {number} duration - Decimal and negative values are valid
     * @param {String} unit - Decimal and negative values are valid
     * @returns {Date}
     */
    calculateEndDate: function (fromDate, duration) {
        let __fromDate = this.__preProcessDates(fromDate);
        if (duration == 0) return this.__postProcessDates(__fromDate);
        let endDate = this.__calculateEndDate(__fromDate, duration);
        return this.__postProcessDates(endDate);
    },

    __calculateWorkingDuration: function (startDate, endDate, unit) {
        if (startDate.getTime() == endDate.getTime()) return 0;
        let __startDate = new Date(startDate);
        let __endDate = new Date(endDate);
        if (this.__getUnitOrder(unit) == -1) unit = this.config.durationUnit;

        // Safety check
        if (__startDate > __endDate) {
            let tempDate = __startDate;
            __startDate = __endDate;
            __endDate = tempDate;
        }

        __startDate = this.__getClosestFutureWorkDate(__startDate);
        __endDate = this.__getClosestFutureWorkDate(__endDate);
        let duration = 0;
        while (__startDate < __endDate) {
            let next = new Date(__startDate);
            let durationFromBoundary = this.__calculateDurationFromWorkTimeBoundary(__startDate, 'millisecond', true);
            next.setTime(next.getTime() + durationFromBoundary);
            if (+next < +__endDate) {
                duration += durationFromBoundary;
                __startDate = this.__getClosestFutureWorkDate(next);
            } else {
                let toAdd = __endDate.valueOf() - __startDate.valueOf();
                duration += toAdd;
                __startDate = new Date(__endDate);
            }
        }
        if (unit == "millisecond") return duration;
        if (unit == "second") return duration / 1000;
        if (unit == "minute") return duration / (1000 * 60);
        if (unit == "hour") return duration / (1000 * 60 * 60);
        if (unit == "day") return duration / (1000 * 60 * 60 * this.getTimePeriod().hoursPerDay);
    },

    /**
     * Calculates working duration between the passed
     * arguments. If no unit is provided, it retrieves
     * its value from that which was provided to
     * CalendarBuilder
     * @param {Date} startDate 
     * @param {Date} endDate
     * @param {String} unit
     * @returns {number}
     */
    calculateWorkingDuration: function (startDate, endDate, unit) {
        if (arguments.length < 2) throw new Error("Start and End date must be provided");
        let __startDate = this.__preProcessDates(startDate);
        let __endDate = this.__preProcessDates(endDate);
        return this.__calculateWorkingDuration(__startDate, __endDate, unit);
    },
}

module.exports = CalendarBuilder;