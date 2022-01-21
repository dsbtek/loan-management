'use strict';

let Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "isRepaymentOption" from table "Offsets"
 * addColumn "cleared" to table "Offsets"
 * changeColumn "parent" on table "Offsets"
 * changeColumn "parent" on table "Offsets"
 *
 **/

let info = {
    'revision': 6,
    'name': 'noname',
    'created': '2021-11-23T20:25:50.854Z',
    'comment': ''
};

let migrationCommands = function(transaction) {
    return [{
        fn: 'removeColumn',
        params: [
            'Offsets',
            'isRepaymentOption',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'Offsets',
            'cleared',
            {
                'type': Sequelize.BOOLEAN,
                'field': 'cleared',
                'defaultValue': false
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'changeColumn',
        params: [
            'Offsets',
            'parent',
            {
                'type': Sequelize.UUID,
                'onUpdate': 'CASCADE',
                'onDelete': 'CASCADE',
                'allowNull': true,
                'field': 'parent',
                'references': {
                    'model': 'Offsets',
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
            'Offsets',
            'parent',
            {
                'type': Sequelize.UUID,
                'onUpdate': 'CASCADE',
                'onDelete': 'CASCADE',
                'allowNull': true,
                'field': 'parent',
                'references': {
                    'model': 'Offsets',
                    'key': 'id'
                },
                'foreignKey': true
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
            'Offsets',
            'cleared',
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'addColumn',
        params: [
            'Offsets',
            'isRepaymentOption',
            {
                'type': Sequelize.BOOLEAN,
                'field': 'isRepaymentOption',
                'defaultValue': false
            },
            {
                transaction: transaction
            }
        ]
    },
    {
        fn: 'changeColumn',
        params: [
            'Offsets',
            'parent',
            {
                'type': Sequelize.UUID,
                'field': 'parent',
                'references': {
                    'model': 'Offsets',
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
            'Offsets',
            'parent',
            {
                'type': Sequelize.UUID,
                'field': 'parent',
                'references': {
                    'model': 'Offsets',
                    'key': 'id'
                },
                'foreignKey': true
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
