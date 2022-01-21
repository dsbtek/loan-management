'use strict';

let Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "paidDate" from table "PaidSalaries"
 * removeColumn "salaryDate" from table "PaidSalaries"
 * addColumn "date" to table "PaidSalaries"
 * addColumn "week" to table "PaidSalaries"
 * addColumn "month" to table "PaidSalaries"
 * addColumn "year" to table "PaidSalaries"
 * addColumn "week" to table "PayItems"
 * addColumn "month" to table "PayItems"
 * addColumn "year" to table "PayItems"
 *
 **/

let info = {
    'revision': 3,
    'name': 'noname',
    'created': '2021-10-25T08:47:56.678Z',
    'comment': ''
};

let migrationCommands = function(transaction) {
    return [{
        fn: 'removeColumn',
        params: [
            'PaidSalaries',
            'paidDate',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PaidSalaries',
            'salaryDate',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PaidSalaries',
            'date',
            {
                'type': Sequelize.DATE,
                'field': 'date'
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PaidSalaries',
            'week',
            {
                'type': Sequelize.STRING,
                'field': 'week'
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PaidSalaries',
            'month',
            {
                'type': Sequelize.STRING,
                'field': 'month'
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PaidSalaries',
            'year',
            {
                'type': Sequelize.STRING,
                'field': 'year'
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
            'week',
            {
                'type': Sequelize.STRING,
                'field': 'week'
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
            'month',
            {
                'type': Sequelize.STRING,
                'field': 'month'
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
            'year',
            {
                'type': Sequelize.STRING,
                'field': 'year'
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
            'PaidSalaries',
            'date',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PaidSalaries',
            'week',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PaidSalaries',
            'month',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PaidSalaries',
            'year',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PayItems',
            'week',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PayItems',
            'month',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PayItems',
            'year',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PaidSalaries',
            'paidDate',
            {
                'type': Sequelize.DATE,
                'field': 'paidDate'
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'PaidSalaries',
            'salaryDate',
            {
                'type': Sequelize.DATE,
                'field': 'salaryDate'
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
