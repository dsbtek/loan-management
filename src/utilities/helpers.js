const moment = require('moment');

function removeArrayProperties(obj, array, model){
    let p = {};
    if (model) obj = obj.toJSON();
    Object.keys(obj).forEach(k => {
        if(!array.includes(k)) p[k] = obj[k];
    });
    return p;

}

function checkPassword(str){
    let re = /^(?=.*\d)(?=.*[!@#$%^'"&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return re.test(str);
}
function isValidPhoneNumber(num){
    let re = /\+1?\d{9,15}$/;
    return re.test(num);
} 
function isValidEmail(email){
    let re = /^[a-z]+.*@[a-z].*\.[a-z]+$/;
    return re.test(email);
} 


function returnOnlyArrayProperties(obj, array, model){
    let newObj = {};
    if (model) obj = obj.toJSON();
    Object.keys(obj).forEach(k => {
        if(array.includes(k)) newObj[k] = obj[k];
    });
    return newObj;

}

function sumArray(array, key){
    let total = 0;
    array.forEach( o => {
        total += key ? o[key] : o;
    });
    return total;

}

function formatDate(date) { return moment(new Date(date)).format('DD MMM YYYY');} 


const intlFormat = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0, 
    maximumFractionDigits: 4, 
});

const formatCurrency = (number) => intlFormat.format(number); 

module.exports = {
    removeArrayProperties,
    returnOnlyArrayProperties,
    sumArray, 
    checkPassword, 
    isValidPhoneNumber, 
    isValidEmail,
    formatDate,
    formatCurrency

};
