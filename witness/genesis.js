"use strict";
const db = require('byteballcore/db.js');
const headlessWallet = require('headless-byteball');
const eventBus = require('byteballcore/event_bus.js');
const constants = require('byteballcore/constants.js');

function onError(err) {
    throw Error(err);
}

function createGenesisUnit(witness, onDone) {
    var composer = require('byteballcore/composer.js');
    var network = require('byteballcore/network.js');

    var savingCallbacks = composer.getSavingCallbacks({
        ifNotEnoughFunds: onError,
        ifError: onError,
        ifOk: function(objJoint) {
            network.broadcastJoint(objJoint);
            onDone(objJoint.unit.unit);
        }
    });

    composer.setGenesis(true);
    composer.composeJoint({
        witnesses: [witness],
        paying_addresses: [witness],
        outputs: [
            { address: witness, amount: 1000000 },
            { address: witness, amount: 1000000 },
            { address: witness, amount: 1000000 },
            { address: witness, amount: 1000000 },
            { address: witness, amount: 1000000 },
            { address: witness, amount: 0 }, // change output
        ],
        signer: headlessWallet.signer,
        callbacks: {
            ifNotEnoughFunds: onError,
            ifError: onError,
            ifOk: function(objJoint, assocPrivatePayloads, composer_unlock) {
                constants.GENESIS_UNIT = objJoint.unit.unit;
                savingCallbacks.ifOk(objJoint, assocPrivatePayloads, composer_unlock);
            }
        }
    });

}

function addMyWitness(witness, onDone) {
    db.query("INSERT INTO my_witnesses (address) VALUES (?)", [witness], onDone);    
}

eventBus.once('headless_wallet_ready', function() {
    headlessWallet.readSingleAddress(function(address) {
        createGenesisUnit(address, function(genesisHash) {
            console.log("Genesis created, hash=" + genesisHash);
            addMyWitness(address, function() {
                process.exit(0);
            });
        });
    });
});
