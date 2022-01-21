const moment = require('moment');

Date.prototype.monthDays= function(previous){
    let d= new Date(this.getFullYear(), this.getMonth()+ (previous ? 0: 1), 0);
    return d.getDate();
};

Date.prototype.startOf = function(period){
    return new Date(moment(this).startOf(period));
};

Date.prototype.endOf = function(period){
    return new Date(moment(this).endOf(period));
};

Date.prototype.yearsArray= function(str, desc){
    let years = [];
    for (let i=2017; i <= this.getFullYear(); i++) {
        years.push(str ? i.toString(): i);
    }
    return desc ? years.reverse() : years;
};

Date.prototype.addWorkDays = function (days) {
    if(isNaN(days)) {
        console.log('Value provided for "days" was not a number');
        return;
    }
    // Get the day of the week as a number (0 = Sunday, 1 = Monday, .... 6 = Saturday)
    let dow = this.getDay();
    let daysToAdd = parseInt(days);
    // If the current day is Sunday add one day
    if (dow === 0) {
        daysToAdd++;
    }
    // If the start date plus the additional days falls on or after the closest Saturday calculate weekends
    if (dow + daysToAdd >= 6) {
        //Subtract days in current working week from work days
        let remainingWorkDays = daysToAdd - (5 - dow);
        //Add current working week's weekend
        daysToAdd += 2;
        if (remainingWorkDays > 5) {
            //Add two days for each working week by calculating how many weeks are included
            daysToAdd += 2 * Math.floor(remainingWorkDays / 5);
            //Exclude final weekend if the remainingWorkDays resolves to an exact number of weeks
            if (remainingWorkDays % 5 === 0)
                daysToAdd -= 2;
        }
    }
    this.setDate(this.getDate() + daysToAdd);
};
function add_weeks(dt, n, substract) {
    let date = new Date(dt);
    if(substract) return new Date(date.setDate(date.getDate() - (n * 7)));      
    return new Date(date.setDate(date.getDate() + (n * 7)));      
}
function add_days(dt, n, substract){
    let date = new Date(dt);
    if (substract) return new Date(date.setDate(date.getDate() - n));  
    return new Date(date.setDate(date.getDate() + n));  
}
  
function add_months(dt, n, substract){
    let date = new Date(dt);
    if (substract) return new Date(date.setMonth(date.getMonth() - n));
    return new Date(date.setMonth(date.getMonth() + n));
}
  
Date.prototype.addPeriod = function(type, period, substract){
    let dt = this;
    switch(type){
    case 'Days': 
        return add_days(dt, period, substract);
    case 'Months':
        return add_months(dt, period, substract);
    case 'Weeks':
        return add_weeks(dt, period, substract);
    }
};
  
// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
    let date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    let week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7);
};
  
// Returns the four-digit year corresponding to the ISO week of the date.
Date.prototype.getWeekYear = function() {
    let date = new Date(this.getTime());
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    return date.getFullYear();
};
// console.log(new Date().addPeriod('Days', 7, true));