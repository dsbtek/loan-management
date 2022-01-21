'use strict';

let Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "PaidSalaries", deps: [Users, Staffs]
 * addColumn "transactionReference" to table "PayItems"
 * addColumn "addedBy" to table "PayItems"
 * addColumn "staff" to table "PayItems"
 * addColumn "addedBy" to table "StaffSalaries"
 * addColumn "staff" to table "StaffSalaries"
 * changeColumn "amount" on table "StaffSalaries"
 *
 **/

let info = {
    'revision': 2,
    'name': 'noname',
    'created': '2021-10-24T19:52:24.496Z',
    'comment': ''
};

let migrationCommands = function(transaction) {
    return [{
        fn: 'createTable',
        params: [
            'PaidSalaries',
            {
                'id': {
                    'type': Sequelize.UUID,
                    'field': 'id',
                    'primaryKey': true,
                    'defaultValue': Sequelize.UUIDV1
                },
                'transactionReferencs': {
                    'type': Sequelize.STRING,
                    'field': 'transactionReferencs'
                },
                'amount': {
                    'type': Sequelize.STRING,
                    'field': 'amount',
                    'allowNull': false
                },
                'paidDate': {
                    'type': Sequelize.DATE,
                    'field': 'paidDate'
                },
                'salaryDate': {
                    'type': Sequelize.DATE,
                    'field': 'salaryDate'
                },
                'payee': {
                    'type': Sequelize.UUID,
                    'onUpdate': 'CASCADE',
                    'onDelete': 'NO ACTION',
                    'allowNull': true,
                    'field': 'payee',
                    'references': {
                        'model': 'Users',
                        'key': 'id'
                    },
                    'foreignKey': true
                },
                'staff': {
                    'type': Sequelize.UUID,
                    'onUpdate': 'CASCADE',
                    'onDelete': 'CASCADE',
                    'allowNull': true,
                    'field': 'staff',
                    'references': {
                        'model': 'Staffs',
                        'key': 'id'
                    },
                    'foreignKey': true
                },
                'createdAt': {
                    'type': Sequelize.DATE,
                    'field': 'createdAt',
                    'allowNull': false
                },
                'updatedAt': {
                    'type': Sequelize.DATE,
                    'field': 'updatedAt',
                    'allowNull': false
                }
            },
            {
                'transaction': transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PayItems',
            'transactionReference',
            {
                'type': Sequelize.STRING,
                'field': 'transactionReference'
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PayItems',
            'addedBy',
            {
                'type': Sequelize.UUID,
                'onUpdate': 'CASCADE',
                'onDelete': 'NO ACTION',
                'allowNull': true,
                'field': 'addedBy',
                'references': {
                    'model': 'Users',
                    'key': 'id'
                },
                'foreignKey': true
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PayItems',
            'staff',
            {
                'type': Sequelize.UUID,
                'onUpdate': 'CASCADE',
                'onDelete': 'CASCADE',
                'allowNull': true,
                'field': 'staff',
                'references': {
                    'model': 'Staffs',
                    'key': 'id'
                },
                'foreignKey': true
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'StaffSalaries',
            'addedBy',
            {
                'type': Sequelize.UUID,
                'onUpdate': 'CASCADE',
                'onDelete': 'NO ACTION',
                'allowNull': true,
                'field': 'addedBy',
                'references': {
                    'model': 'Users',
                    'key': 'id'
                },
                'foreignKey': true
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'StaffSalaries',
            'staff',
            {
                'type': Sequelize.UUID,
                'onUpdate': 'CASCADE',
                'onDelete': 'CASCADE',
                'allowNull': true,
                'field': 'staff',
                'references': {
                    'model': 'Staffs',
                    'key': 'id'
                },
                'foreignKey': true
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'changeColumn',
        params: [
            'StaffSalaries',
            'amount',
            {
                'type': 'DECIMAL USING (AMOUNT::INTEGER)',
                'field': 'amount',
                'allowNull': false
            },
            {
                transaction: transaction
            }
        ]
    }
    ];
};
let rollbackCommands = function(transaction) {
    return [{
        fn: 'removeColumn',
        params: [
            'PayItems',
            'transactionReference',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PayItems',
            'addedBy',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PayItems',
            'staff',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'StaffSalaries',
            'addedBy',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'StaffSalaries',
            'staff',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'dropTable',
        params: ['PaidSalaries', {
            transaction: transaction
        }]
    },
    {
        fn: 'changeColumn',
        params: [
            'StaffSalaries',
            'amount',
            {
                'type': Sequelize.STRING,
                'field': 'amount',
                'allowNull': false
            },
            {
                transaction: transaction
            }
        ]
    }
    ];
};

module.exports = {
    pos: 0,
    useTransaction: true,
    execute: function(queryInterface, Sequelize, _commands)
    {
        let index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function(resolve, reject) {
                function next() {
                    if (index < commands.length)
                    {
                        let command = commands[index];
                        console.log('[#'+index+'] execute: ' + command.fn);
                        index++;
                        queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                    }
                    else
                        resolve();
                }
                next();
            });
        }
        if (this.useTransaction) {
            return queryInterface.sequelize.transaction(run);
        } else {
            return run(null);
        }
    },
    up: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
