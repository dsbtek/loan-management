const app = require('../../../app.js');
const request = require('supertest')(app);
const db = require('../../db/models');
const url = '/api/v1/companies';
const faker = require('faker');

const { login, getAuthHeader }  = require('./auth');

const staff = {
    email: faker.internet.email().toLowerCase(), 
    password: 'staffuser1!2A', 
    phoneNumber: '+332323' + + faker.datatype.number(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    address: {
        houseNumber: faker.datatype.number(),
        street: faker.address.streetName(),
        city: faker.address.city(),
        lga: faker.address.city(),
        country: faker.address.country()
    },
    staffId: '123456',
    accountDetails: {
        bank: 'Zenith',
        name: 'Staff q',
        number: '1010101010'
    }
};
const company = { 
    'name': faker.company.companyName(),
    'phone' : '+070661776' + faker.datatype.number(),
    'email': faker.internet.email().toLowerCase(),
    'address': {
        houseNumber: faker.datatype.number(),
        street: faker.address.streetName(),
        city: faker.address.city(),
        lga: faker.address.city(),
        country: faker.address.country()
    }
};

        
const getStaffDetails = async (user) => {
    const resp =  await login('sfmndako@gmail.com', 'spassword');
    const data = resp.body;
    user = data.user;
    const base = getAuthHeader(data);
    let re = await request
        .post(url)
        .send(company).set(base);
    const cpy = await db.Company.findOne({where: {name: company.name}});
    company.id = cpy.id;
    let req = await request
        .post(url + `/staff/${company.id}/${user.id}`)
        .send(staff).set(base);
    const staffUser = await db.User.findOne({where: {email: staff.email}});
    const staffStaff = await db.Staff.findOne({where: {UserId: staffUser.id, CompanyId: cpy.id}});
    return { staff: {staff: staffStaff, user: staffUser}, company: cpy, base, userId: user.id};
};



module.exports = {
    getStaffDetails
};