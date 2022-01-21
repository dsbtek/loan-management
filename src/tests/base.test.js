const moment = require('moment');
const app = require('../../app'); // Link to your server file
const supertest = require('supertest');
const SalaryController = require('../controllers/company/salary');
const request = supertest(app);


describe('App Endpoints', () => {
    it('should test that 1 + 1 === 2', () => {
        expect(2).toEqual(2);
    });
    it('gets the test endpoint', async done => {
        const response = await request.get('/');
        expect(response.statusCode).toEqual(200);
        done();
    });



    it ('it should return correct current salary', () =>{
        const salarylist = [
            {
                effectiveDate: new Date().startOf('year').startOf('month'),
                amount: 10000
            },
            {
                effectiveDate: new Date(`25 Oct ${new Date().getFullYear()}`),
                amount: 30000
            },
            {
                effectiveDate: new Date().startOf('year').startOf('month').addPeriod('Months', 3),
                amount: 20000
            },
            {
                effectiveDate: new Date().endOf('year').startOf('month'),
                amount: 40000
            },
        ];
        let results = [
            10000, 
            10000, 
            10000, 
            20000, 
            20000,
            20000, 
            20000,
            20000, 
            20000,
            20000,
            30000,
            40000,
        ];
        const allMonths = moment.monthsShort();
        let salaries = salarylist.sort(function(a,b){return (new Date(a.effectiveDate) > new Date(b.effectiveDate) ? 1 : -1);});

        allMonths.forEach((month, ind) => {
            let salary = SalaryController.getStaffCurrentSalary(salaries, month, '2021');
            console.log(month, salary, results[ind]);
            expect(salary.amount).toEqual(results[ind]);
        });
    });
});