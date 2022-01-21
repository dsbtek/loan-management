const faker = require('faker');

const app = require('../../app.js');
const request = require('supertest')(app);
const db = require('../db/models');
const url = '/api/v1/loans';
const { createNewUser, getAuthHeader, login }  = require('./commands/auth');
let base;

const user = {
    email: faker.internet.email(), 
    password: 'loanuser!2A', 
    phoneNumber: '+0706617949945',
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
};

const loanUser1 = { 
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    'numbers' : ['+07066177665523'],
    'emails': ['quickinfong11@gmail.com']
};
const loanUser2 = { 
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    'numbers' : ['+07066177665523'],
    'emails': [faker.internet.email(),]
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
    },
};

describe('LOAN record API', () => {
    it('should set up a user', async () => {
        // let data =  await createNewUser(user);
        let resp = await login('sfmndako@gmail.com', 'spassword');
        let data = resp.body;
        expect(data).toHaveProperty('token');
        user.id = data.user.id;
        base = getAuthHeader(data);
        console.log(data);
    });
    it('should create loan user', async (done) => {
        const res = await request
            .post(url + '/users')
            .send(loanUser1).set(base);
        expect(res.status).toEqual(201);
        expect(res.body).toHaveProperty('id');
        loanUser1.id = res.body.id;
        const users = await db.User.findAll({where: {creatorId: user.id, type: 'private' }});
        expect(users.length).toEqual(1);
        done();
    });
    it('should not create loan user - same email or phone number', async () => {
        const res = await request
            .post(url + '/users')
            .send(loanUser1).set(base);
        expect(res.status).toEqual(400);
    });

    it('should not create loan - if repayment type is once and repayment date is not provided', async () => {
        // Once but without date should fail
        loan.lender = loanUser1.id;
        let res = await request
            .post(url)
            .send(loan).set(base);
        expect(res.status).toEqual(400);
    });
    it('should create loan -if repayment type is once and repayment date is provided', async () => {
        loan.dateToRepay = '30 Sept 2021';
        let res = await request
            .post(url)
            .send(loan).set(base);
        expect(res.status).toEqual(200);
    });
    it('should not create loan - if repayment type is periodic and no options are provided', async () => {
        // Several without options should fail
        loan.repaymentType = 'periodic';
        let res = await request
            .post(url)
            .send(loan).set(base);
        expect(res.status).toEqual(400);
    });
    it('should not create loan - if repayment type is custom and without list', async () => {
        loan.amount = 300000;
        loan.repaymentType = 'custom';
        loan.repaymentOptions = {
            'amount': 5000,
            'period': 'weekly',
        };
        let res = await request
            .post(url)
            .send(loan).set(base);
        expect(res.status).toEqual(400);
    });
    it('should create loan - if repayment type is custom with list', async () => {
        // Several with options - custom true with list should pass
        loan.amount = 300000;
        loan.repaymentType = 'custom';
        loan.repaymentOptions = {
            'list': [
                {amount: 50000, date: '23 Oct 2021'},
                {amount: 200000, date: '23 Nov 2021'},
                {amount: 50000, date: '12 Sept 2021'},
            ]
        };
        let res = await request
            .post(url)
            .send(loan).set(base);
            
        expect(res.status).toEqual(200);
    });
    it('should create loan - if repayment type is periodic with options', async () => {
        // Several with options - custom false should pass
        loan.amount = 300000;
        loan.repaymentType = 'periodic';
        loan.repaymentOptions = {
            'amount': 5000,
            'period': 'Monthly',
            type: 'Custom',
            // type: 'Last Day of Month',
            day: '25',
        };

        let res = await request
            .post(url)
            .send(loan).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('detail');
        // const loans = await db.Loan.findAll({where: {userId: user.id}});
    });

    it('should fetch all loans', async () => {
        const res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        const loanProperties = ['amount', 'Lender', 'User', 'otherUser'];
        loanProperties.forEach(p => expect(res.body.records[0]).toHaveProperty(p));
        expect(res.status).toEqual(200);
    });

    it('should verify that repayment offset were created on loan creation', async () => {
        const res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        let results = [60, 3, 0];
        results.forEach((item, ind) => {
            expect(res.body.records[ind].offsets.length).toEqual(item);
        });
        expect(res.status).toEqual(200);
    });

    it('should offset a loan', async () => {
        let res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        let loan = res.body.records[2];
        let offset = {
            date: new Date('01 Nov 2021'),
            remarks: 'Sorry for lateness',
            amount: 4000,
        };
        res = await request
            .post(url + `/offset/${loan.id}`).set(base).send(offset);
        expect(res.body).toHaveProperty('detail');
        res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body.records[2].offsets.length).toEqual(1);
        expect(res.body).toHaveProperty('records');
        expect(res.status).toEqual(200);
    });


    it('should clear a repayment option - offset', async () => {
        let res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        let loan = res.body.records[0];
        let offset = {
            date: new Date('01 Nov 2021'),
            remarks: 'Sorry for lateness',
        };
        res = await request
            .post(url + `/offset/${loan.id}/${loan.offsets[0].id}/clear`).set(base).send(offset);
        expect(res.body).toHaveProperty('detail');
        res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body.records[0].offsets.length).toEqual(60);
        expect(res.body.records[0].balance).toEqual(295000);
        expect(res.body.records[0].totalCleared).toEqual(5000);
        expect(res.status).toEqual(200);
    });

    it('should update a repayment option - offset', async () => {
        let res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        let loan = res.body.records[1];
        let offset = {
            date: new Date('01 Nov 2021'),
            remarks: 'Sorry for lateness',
            amount: 100000,
        };
        res = await request
            .put(url + `/offset/${loan.id}/${loan.offsets[0].id}`).set(base).send(offset);
        expect(res.body).toHaveProperty('detail');
        res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body.records[1].offsets.length).toEqual(3);
        expect(res.body.records[1].offsets[0].amount).toEqual('100,000');
        expect(res.status).toEqual(200);
    });

    it('should delete a repayment option - offset', async () => {
        let res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        let loan = res.body.records[1];
        res = await request
            .delete(url + `/offset/${loan.id}/${loan.offsets[1].id}`).set(base);
        expect(res.body).toHaveProperty('detail');
        res = await request
            .get(url).set(base);
        expect(res.status).toEqual(200);
        expect(res.body.records[1].offsets.length).toEqual(2);
        expect(res.status).toEqual(200);
    });

    it('should return/search all  users excluding self ', async () => {
        let search = '23';
        let res = await request
            .get(`/api/v1/users/search?query=${search}`).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        let count = res.body.returnedCount;

        // all users excluding private and self
        res = await request
            .get(`/api/v1/users/search?query=${search}&request=true`).set(base);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('records');
        // expect(res.body.returnedCount).toEqual(count - 1);
    });
    it('should not request for loan - private users n self', async () => {
        // Should not send to users private users
        loan.lender = loanUser1.id;
        let res = await request
            .post(url + '/request').set(base).send(loan);
        expect(res.status).toEqual(400);
        expect(res.body).toHaveProperty('error');

        loan.lender = user.id;
        res = await request
            .post(url + '/request').set(base).send(loan);
        expect(res.status).toEqual(400);
        expect(res.body).toHaveProperty('error');
    });
    it('should not request for loan without security', async () => {
        let partner = await db.User.findOne({where: {email: 'sfmndako@gmail.com'}});
        loan.lender = partner.id;
        let res = await request
            .post(url + '/request').set(base).send(loan);
        expect(res.status).toEqual(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should request for loan with security', async () => {
        loan.security = 'goodly loan';
        let res = await request
            .post(url + '/request').set(base).send(loan);
        expect(res.status).toEqual(400);
        // expect(res.body).toHaveProperty('detail');
    });
}
);
