# Gantt Calendar v1.0.2
A non-UI calendar module based on working hours, working days, holidays. It lets you count the number of business days/hours between 2 dates, get next working days and so on.

## Getting Started

Importing the module gives access to the *CalendarBuilder* function object which is initialized as:

```
const CalendarBuilder = require('gantt-calendar');
let calendarBuilder  = new CalendarBuilder();
```

Set the properties of the calendar through the setters of the *calendarBuilder* and finally:

```
let calendar = calendarBuilder.build();
```

Then all calendar methods can be utilized.

See the [package source](https://github.com/Vignatus/gantt-calendar).
