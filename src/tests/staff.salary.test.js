const faker = require('faker');
const moment = require('moment');

const app = require('../../app.js');
const request = require('supertest')(app);
const db = require('../db/models');
const Op = db.Sequelize.Op;
const url = '/api/v1/companies/staff/salary';
const { getStaffDetails }  = require('./commands/staff');
let user, base, staff, company;
const allMonths = moment.monthsShort();



describe('STAFF API', () => {
    it('should get staff', async () => {
        let resp = await getStaffDetails();
        expect(resp).toHaveProperty('staff');
        user = resp.user;
        base = resp.base;
        staff = resp.staff;
        company = resp.company;
    });

    it('should add staff salary', async () => {
        let previousMonth = new Date().setDate(0);
        let nextMonth = new Date().addPeriod('Months', 1); 
        let salary = {
            type: 'monthly',
            amount: 20000,
            effectiveDate: new Date(previousMonth).startOf('month'),
        };
        let res = await request
            .post(url + `/${staff.staff.id}`)
            .send(salary).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('detail');
        // saveSalary = await db.Staff.findOne({where: { amount:  20000, staff: staff.staff.id}});
        let companyStaff = await request
            .get(`/api/v1/companies/staff/${company.id}?ids=${staff.staff.id}`)
            .set(base);
            // salaries = await request
            //     .get(url + `/${company.id}?id=${saveSalary.id}`)
            //     .set(base);
        expect(companyStaff.body.records[0].currentSalary.amount).toEqual('20000');
        
        salary = {
            type: 'monthly',
            amount: 30000,
            effectiveDate: new Date().startOf('month'),
        };
        res = await request
            .post(url + `/${staff.staff.id}`)
            .send(salary).set(base);
        expect(res.status).toEqual(200);
        companyStaff = await request
            .get(`/api/v1/companies/staff/${company.id}?ids=${staff.staff.id}`)
            .set(base);
        expect(companyStaff.body.records[0].currentSalary.amount).toEqual('30000');
        salary = {
            type: 'monthly',
            amount: 40000,
            effectiveDate: nextMonth.startOf('month'),
        };
        res = await request
            .post(url + `/${staff.staff.id}`)
            .send(salary).set(base);
        expect(res.status).toEqual(200);
        companyStaff = await request
            .get(`/api/v1/companies/staff/${company.id}?ids=${staff.staff.id}`)
            .set(base);
        expect(companyStaff.body.records[0].currentSalary.amount).toEqual('30000');
            
    });

    it('should add staff pay item', async () => {
        const month = allMonths[new Date().getMonth()];
        let item = {
            type: 'earnings',
            amount: 10000,
            startDate: new Date().startOf('month'),
            endDate: new Date().endOf('month'),
            name: 'Overtime',
            transactionReference: 'kfjeiwojeriojdfgjio'
        };
        let res = await request
            .post(url + `/pay-item/${staff.staff.id}`)
            .send(item).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('detail');

        item = {
            type: 'deductions',
            amount: 5000,
            startDate: new Date().startOf('month'),
            endDate: new Date().endOf('month'),
            name: 'Loan Servicing',
            transactionReference: 'kfjeiwojeriojdfgjio'
        };
        res = await request
            .post(url + `/pay-item/${staff.staff.id}`)
            .send(item).set(base);
        expect(res.status).toEqual(200);
        let salaries = await request
            .get(url + `/${company.id}?id=${staff.staff.id}`)
            .set(base);
        expect(salaries.body.records[0][month].currentSalary.amount).toEqual('30000');
        expect(salaries.body.records[0][month].calculatedPay).toEqual(35000);
    });

    it('should add staff pay item - more deductions and earnings', async () => {
        const month = allMonths[new Date().getMonth()];
        let item = {
            type: 'earnings',
            amount: 20000,
            startDate: new Date().addPeriod('Months', 13, true).startOf('month'),
            endDate: new Date().addPeriod('Months', 1, true).endOf('month'),
            name: 'Overtime',
            transactionReference: 'kfjeiwojeriojdfgjio'
        };

        // this item is equivalent to Oct last year to Oct this year
        let res = await request
            .post(url + `/pay-item/${staff.staff.id}`)
            .send(item).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('detail');

        item = {
            type: 'deductions',
            amount: 3000,
            startDate:  new Date().addPeriod('Months', 1, true).startOf('month'),
            endDate: new Date().addPeriod('Months', 11).endOf('month'),
            name: 'Loan Servicing',
            transactionReference: 'kfjeiwojeriojdfgjio'
        };

        // this item is equivalent to oct this year to oct next year
        res = await request
            .post(url + `/pay-item/${staff.staff.id}`)
            .send(item).set(base);

        item = {
            type: 'deductions',
            amount: 4000,
            startDate:  new Date().addPeriod('Months', 11).startOf('month'),
            endDate: new Date().addPeriod('Months', 11).endOf('month'),
            name: 'Loan Servicing',
            transactionReference: 'kfjeiwojeriojdfgjio'
        };
        // this item is begining to ending of oct next year
        res = await request
            .post(url + `/pay-item/${staff.staff.id}`)
            .send(item).set(base); 
        item = {
            type: 'deductions',
            amount: 1000,
            month,
            startDate:  new Date().addPeriod('Months', 11, true).startOf('month'),
            endDate: new Date().addPeriod('Months', 11, true).endOf('month'),
            name: 'Loan Servicing',
            transactionReference: 'kfjeiwojeriojdfgjio'
        };
        // this item is begining to ending of oct last year

        res = await request
            .post(url + `/pay-item/${staff.staff.id}`)
            .send(item).set(base);        
        expect(res.status).toEqual(200);
        let salaries = await request
            .get(url + `/${company.id}?id=${staff.staff.id}`)
            .set(base);
        let previousMonth = allMonths[new Date().addPeriod('Months', 1, true).getMonth()];
        expect(salaries.body.records[0][month].currentSalary.amount).toEqual('30000');
        expect(salaries.body.records[0][month].calculatedPay).toEqual(32000);

        expect(salaries.body.records[0][previousMonth].currentSalary.amount).toEqual('20000');
        expect(salaries.body.records[0][previousMonth].calculatedPay).toEqual(37000);

    });
    it('should pay salary', async () => {
        const month = allMonths[new Date().getMonth()];
        let item = {
            amount: 32000,
            date: new Date(),
            month,
            year: new Date().getFullYear().toString(),
            transactionReference: 'kfjeiwojeriojdfgjio'
        };
        let res = await request
            .post(url + `/pay/${staff.staff.id}`)
            .send(item).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('detail');
        let salaries = await request
            .get(url + `/${company.id}?id=${staff.staff.id}`)
            .set(base);
        expect(salaries.body.records[0][month].currentSalary.amount).toEqual('30000');
        expect(salaries.body.records[0][month].calculatedPay).toEqual(32000);
        expect(salaries.body.records[0][month].paidSalaries.list.length).toEqual(1);
        expect(salaries.body.records[0][month].paidSalaries.list[0].amount).toEqual('32000');
    });

    it('should get all pay items', async () => {
        let resp = await request
            .get(url + `/${company.id}/earnings?id=${staff.staff.id}`)
            .set(base);
        expect(resp.body.totalCounts).toEqual(2);
        resp = await request
            .get(url + `/${company.id}/deductions?id=${staff.staff.id}`)
            .set(base);
        expect(resp.body.totalCounts).toEqual(2);
    });
    it('should get all staff paid salaries', async () => {
        let resp = await request
            .get(url + `/${company.id}/paid-salaries?id=${staff.staff.id}`)
            .set(base);
        expect(resp.body.totalCounts).toEqual(1);
    });
    it('should get all staff salaries', async () => {
        let resp = await request
            .get(url + `/${company.id}/list?id=${staff.staff.id}`)
            .set(base);
        expect(resp.body.totalCounts).toEqual(3);
    });

    // it('should edit staff pay item', async () => {
    //     let payItem = await db.payItem.findOne();
    //     let item = {
    //         type: 'earnings',
    //         amount: 20000,
    //         startDate: new Date().startOf('month'),
    //         endDate: new Date().endOf('month'),
    //         name: 'Overtime',
    //         transactionReference: 'kfjeiwojeriojdfgjio'
    //     };
    //     let res = await request
    //         .puts(url + `/pay-item/${payItem.id}`)
    //         .send(item).set(base);
    //     expect(res.status).toEqual(200);
    //     expect(res.body).toHaveProperty('detail');
    // });

    it('should delete staff pay item', async () => {
        let payItems = await db.PayItem.findAll();
        let length = payItems.length;
        let res = await request
            .delete(url + `/${company.id}/deductions/${payItems[0].id}`)
            .set(base);
        expect(res.status).toEqual(200);
        payItems = await db.PayItem.findAll();
        expect(length).toEqual(payItems.length + 1);
    });
});
