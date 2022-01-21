'use strict';

let Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Members", deps: []
 * createTable "ContributionPayItems", deps: [Users, Members]
 * createTable "Contributions", deps: [Users, Members]
 * addColumn "startDate" to table "PayItems"
 * addColumn "endDate" to table "PayItems"
 *
 **/

let info = {
    'revision': 4,
    'name': 'noname',
    'created': '2021-11-03T17:10:55.563Z',
    'comment': ''
};

let migrationCommands = function(transaction) {
    return [{
        fn: 'createTable',
        params: [
            'Members',
            {
                'id': {
                    'type': Sequelize.UUID,
                    'field': 'id',
                    'primaryKey': true,
                    'defaultValue': Sequelize.UUIDV1
                },
                'dateJoined': {
                    'type': Sequelize.DATE,
                    'field': 'dateJoined'
                },
                'PN': {
                    'type': Sequelize.STRING,
                    'field': 'PN'
                },
                'memberId': {
                    'type': Sequelize.STRING,
                    'field': 'memberId'
                },
                'status': {
                    'type': Sequelize.STRING,
                    'field': 'status',
                    'defaultValue': 'inactive'
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
                },
                'addedById': {
                    'type': Sequelize.UUID,
                    'field': 'addedById',
                    'allowNull': true
                },
                'UserId': {
                    'type': Sequelize.UUID,
                    'field': 'UserId',
                    'allowNull': true
                },
                'CompanyId': {
                    'type': Sequelize.UUID,
                    'field': 'CompanyId',
                    'allowNull': true
                },
                'currentContributionId': {
                    'type': Sequelize.UUID,
                    'field': 'currentContributionId',
                    'allowNull': true
                }
            },
            {
                'transaction': transaction
            }
        ]
    },
    {
        fn: 'createTable',
        params: [
            'ContributionPayItems',
            {
                'id': {
                    'type': Sequelize.UUID,
                    'field': 'id',
                    'primaryKey': true,
                    'defaultValue': Sequelize.UUIDV1
                },
                'type': {
                    'type': Sequelize.STRING,
                    'field': 'type',
                    'defaultValue': 'earnings',
                    'allowNull': false
                },
                'name': {
                    'type': Sequelize.STRING,
                    'field': 'name',
                    'allowNull': false
                },
                'transactionReference': {
                    'type': Sequelize.STRING,
                    'field': 'transactionReference'
                },
                'timeInterval': {
                    'type': Sequelize.DECIMAL,
                    'field': 'timeInterval'
                },
                'timeUnit': {
                    'type': Sequelize.STRING,
                    'field': 'timeUnit'
                },
                'rate': {
                    'type': Sequelize.DECIMAL,
                    'field': 'rate'
                },
                'amount': {
                    'type': Sequelize.DECIMAL,
                    'field': 'amount'
                },
                'date': {
                    'type': Sequelize.DATE,
                    'field': 'date'
                },
                'week': {
                    'type': Sequelize.STRING,
                    'field': 'week'
                },
                'month': {
                    'type': Sequelize.STRING,
                    'field': 'month'
                },
                'year': {
                    'type': Sequelize.STRING,
                    'field': 'year'
                },
                'startDate': {
                    'type': Sequelize.DATE,
                    'field': 'startDate'
                },
                'endDate': {
                    'type': Sequelize.DATE,
                    'field': 'endDate'
                },
                'addedBy': {
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
                'member': {
                    'type': Sequelize.UUID,
                    'onUpdate': 'CASCADE',
                    'onDelete': 'CASCADE',
                    'allowNull': true,
                    'field': 'member',
                    'references': {
                        'model': 'Members',
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
        fn: 'createTable',
        params: [
            'Contributions',
            {
                'id': {
                    'type': Sequelize.UUID,
                    'field': 'id',
                    'primaryKey': true,
                    'defaultValue': Sequelize.UUIDV1
                },
                'type': {
                    'type': Sequelize.STRING,
                    'field': 'type',
                    'allowNull': false
                },
                'amount': {
                    'type': Sequelize.DECIMAL,
                    'field': 'amount',
                    'allowNull': false
                },
                'effectiveDate': {
                    'type': Sequelize.DATE,
                    'field': 'effectiveDate',
                    'allowNull': false
                },
                'addedBy': {
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
                'member': {
                    'type': Sequelize.UUID,
                    'onUpdate': 'CASCADE',
                    'onDelete': 'CASCADE',
                    'allowNull': true,
                    'field': 'member',
                    'references': {
                        'model': 'Members',
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
            'startDate',
            {
                'type': Sequelize.DATE,
                'field': 'startDate'
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
            'endDate',
            {
                'type': Sequelize.DATE,
                'field': 'endDate'
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
            'startDate',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'removeColumn',
        params: [
            'PayItems',
            'endDate',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'dropTable',
        params: ['ContributionPayItems', {
            transaction: transaction
        }]
    },
    {
        fn: 'dropTable',
        params: ['Contributions', {
            transaction: transaction
        }]
    },
    {
        fn: 'dropTable',
        params: ['Members', {
            transaction: transaction
        }]
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
