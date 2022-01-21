const faker = require('faker');

const app = require('../../app.js');
const request = require('supertest')(app);
const db = require('../db/models');
const url = '/api/v1/companies';
const { login, getAuthHeader }  = require('./commands/auth');

const staff = {
    email: 'staff1@gmail.com', 
    password: 'staffuser!2A', 
    phoneNumber: '+332323456789',
    firstName: 'Staff',
    lastName: '1',
    address: {
        houseNumber: '23',
        street: 'Adjacent garage',
        city: 'minna',
        lga: 'chachanga',
        country: 'Nigeria'
    },
    staffId: '123456',
    accountDetails: {
        bank: 'Zenith',
        name: 'Staff q',
        number: '1010101010'
    }
  

};
let user, base;

const company = { 
    'name': 'Sdfs Solutions',
    'phone' : '+07066177665523',
    'email': 'quickinfong11@gmail.com',
    'address': {
        houseNumber: '23',
        street: 'Adjacent garage',
        city: 'minna',
        lga: 'chachanga',
        country: 'Nigeria'
    }
};

const loan = {
    'amount': 200000,
    'duration': {
        'number' : 5,
        'period': 'Month'
    },
    'dateTaken': '2 Jun 2021',
    'repaymentType': 'once',
    
    'remarks': faker.lorem.sentence(),
    'notify': true,
    'type': 'Lend',
    'userNotification': {
        'number': 5,
        'type': 'days',
        'frequency': 'weekly' 
    }
};

describe('COMPANY API', () => {
    it('should get admin', async () => {
        const resp =  await login('sfmndako@gmail.com', 'spassword');
        const data = resp.body;
        expect(data).toHaveProperty('user');
        user = data.user;
        base = getAuthHeader(data);
    });

    it('should create company', async (done) => {
        const res = await request
            .post(url)
            .send(company).set(base);
        expect(res.status).toEqual(201);
        expect(res.body).toHaveProperty('detail');
        const cpy = await db.Company.findOne({where: {name: company.name}});
        company.id = cpy.id;
        done();
    });
    it('should not create company with existing name or cac', async () => {
        const res = await request
            .post(url)
            .send(company).set(base);
        expect(res.status).toEqual(400);

    });

    it('should fetch all company', async () => {
        const res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        const ppty = ['records', 'currentPage', 'totalPages', 'returnedCount', 'totalCounts'];
        expect(res.body).toHaveProperty('records');
        // expect(res.body.returnedCount).toEqual(2);
    });


    it('should add company staff', async () => {
        const res = await request
            .post(url + `/staff/${company.id}/${user.id}`)
            .send(staff).set(base);
        expect(res.status).toEqual(201);
        expect(res.body).toHaveProperty('detail');

    });

    it('should get add-staff link ', async () => {
        const res = await request
            .get(url + `/get-add-staff-link/${company.id}`)
            .set(base);

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('detail');
        // company.id = res.body.id;

    });
    it('should get company staff', async () => {
        const cpy = await db.Company.findOne({where: {name: company.name}});
        const res = await request
            .get(url + `/staff/${cpy.id}`)
            .set(base);

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        staff.id = res.body.records[0].id;
        // company.id = res.body.id;

    });

    // it('should update staff salary amount', async () => {
    //     let body = {
    //         amount: 10000
    //     };

    //     const res = await request
    //         .post(url + `/staff/amount/${staff.id}`)
    //         .send(body)
    //         .set(base);

    //     expect(res.status).toEqual(200);
    //     expect(res.body).toHaveProperty('detail');
    //     // company.id = res.body.id;

    // });
    // it('should change staff salary status to paid', async () => {
    //     const res = await request
    //         .post(url + `/staff/paid/${staff.id}`)
    //         .set(base);

    //     expect(res.status).toEqual(200);
    //     expect(res.body).toHaveProperty('detail');
    //     const resp = await request
    //         .get(url + `/staff/${company.id}`)
    //         .set(base);

    //     expect(resp.body.records[0].currentSalary.paid).toEqual(true);
    //     // company.id = res.body.id;

    // });

    // it('should salary string to int', async () => {
    //     const cpy = await db.Company.findOne({where: {name: company.name}});
    //     const resp = await request
    //         .get(url + `/staff/${cpy.id}`)
    //         .set(base);

    //     expect(resp.body.records[0].currentSalary.paid).toEqual(true);
    //     // expect(4).toEqual(45);

    // });
});
