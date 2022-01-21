'use strict';

let Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "config" to table "UserConfigs"
 *
 **/

let info = {
    'revision': 5,
    'name': 'noname',
    'created': '2021-11-20T14:15:24.795Z',
    'comment': ''
};

let migrationCommands = function(transaction) {
    return [{
        fn: 'addColumn',
        params: [
            'UserConfigs',
            'config',
            {
                'type': Sequelize.UUID,
                'field': 'config',
                'onUpdate': 'CASCADE',
                'onDelete': 'cascade',
                'references': {
                    'model': 'Users',
                    'key': 'id'
                },
                'allowNull': true
            },
            {
                transaction: transaction
            }
        ]
    }];
};
let rollbackCommands = function(transaction) {
    return [{
        fn: 'removeColumn',
        params: [
            'UserConfigs',
            'config',
            {
                transaction: transaction
            }
        ]
    }];
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
