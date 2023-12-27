const { response } = require("express");
const mysql = require("mysql2"); //npm install mysql2
const jwt = require("jsonwebtoken");
const os = require("os");
require("dotenv").config();
const useragent = require("express-useragent");

const repostGame = require("./repostGame");

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
});

function convertToTwoDecimalPlaces(number) {
    if (!isNaN(number) && Number(number) % 1 !== 0) {
        const strNumber = number.toString();
        const decimalPlaces = strNumber.split(".")[1].length;
        if (decimalPlaces > 2) {
            return Math.round(number); // แปลงเป็นจำนวนเต็ม
        }
    }
    return number; // คืนค่าเดิมถ้าไม่เข้าเงื่อนไข
}

function hasSimilarData(gameplayturn, input, turnover, betPlay) {
    if (gameplayturn !== "PlayAllGame") {
        const dataString = gameplayturn;
        const dataArray = dataString.split(",");
        let dataArrayGame = dataArray.some((item) => input.includes(item));
        if (dataArrayGame) {
            let postTurnover = turnover - betPlay;
            if (postTurnover < 0) {
                postTurnover = 0;
                return postTurnover;
            } else {
                return postTurnover;
            }
        } else {
            return turnover;
        }
    } else {
        let postTurnover = turnover - betPlay;
        if (postTurnover < 0) {
            postTurnover = 0;
            return postTurnover;
        } else {
            return postTurnover;
        }
    }
}

//Ninja Slot/918 Kiss-------------------------------------------------------------------------------------------------------------------------------------------------------------------

//localhost:5000/post/Ninja918/transaction
http: exports.FishingNinja918 = async (req, res) => {
    const id = req.body.id;
    const productId = req.body.productId;
    const usernames = req.body.username;
    const currency = req.body.currency;
    const timestampMillis = req.body.timestampMillis;
    const txns = req.body.txns;

    //username = 'member001';
    let spl = `SELECT credit FROM member WHERE phonenumber ='${usernames}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                if (txns[0].betAmount.playInfo === "FISHING-Transaction") {
                    const amount = txns[0].betAmount - txns[0].payoutAmount;
                    const balanceNow = balanceUser + amount;
                    res.status(201).json({
                        id: id,
                        statusCode: 0,
                        productId: productId,
                        timestampMillis: timestampMillis,
                        username: usernames,
                        currency: currency,
                        balanceBefore: balanceUser,
                        balanceAfter: balanceNow,
                    });
                } else if (txns[0].betAmount.playInfo === "Fishing-deposit") {
                    const amount = txns[0].betAmount - txns[0].payoutAmount;
                    const balanceNow = balanceUser + amount;
                    res.status(201).json({
                        id: id,
                        statusCode: 0,
                        productId: productId,
                        timestampMillis: timestampMillis,
                        username: usernames,
                        currency: currency,
                        balanceBefore: balanceUser,
                        balanceAfter: balanceNow,
                    });
                } else {
                    const amount = txns[0].betAmount;
                    const balanceNow = balanceUser + amount;
                    res.status(201).json({
                        id: id,
                        statusCode: 0,
                        productId: productId,
                        timestampMillis: timestampMillis,
                        username: usernames,
                        currency: currency,
                        balanceBefore: balanceUser,
                        balanceAfter: balanceNow,
                    });
                }
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------

//localhost:5000/post/game/checkBalance
http: exports.GameCheckBalance = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const sessionToken = req.body.sessionToken;
    if (sessionToken === undefined) {
        let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete ='N'`;
        try {
            connection.query(spl, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    if (results.length >= 1) {
                        const balanceUser = parseFloat(results[0].credit);
                        res.status(201).json({
                            id: id,
                            statusCode: 0,
                            timestampMillis: timestampMillis,
                            productId: productId,
                            currency: currency,
                            balance: balanceUser,
                            username: usernameGame,
                        });
                    } else {
                        res.status(201).json({
                            id: id,
                            statusCode: 30001,
                            timestampMillis: timestampMillis,
                            productId: productId,
                            currency: currency,
                            balance: 0,
                            username: usernameGame,
                        });
                    }
                }
            });
        } catch (err) {
            err.statusCode = 500;
            res.json({ status: "Not Data Request Body." });
        }
    } else {
        let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete ='N' AND tokenplaygame ='${sessionToken}'`;
        try {
            connection.query(spl, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    if (results.length >= 1) {
                        const balanceUser = parseFloat(results[0].credit);
                        res.status(201).json({
                            id: id,
                            statusCode: 0,
                            timestampMillis: timestampMillis,
                            productId: productId,
                            currency: currency,
                            balance: balanceUser,
                            username: usernameGame,
                        });
                    } else {
                        res.status(201).json({
                            id: id,
                            statusCode: 30001,
                            timestampMillis: timestampMillis,
                            productId: productId,
                            currency: currency,
                            balance: 0,
                            username: usernameGame,
                        });
                    }
                }
            });
        } catch (err) {
            err.statusCode = 500;
            res.json({ status: "Not Data Request Body." });
        }
    }
};

//localhost:5000/post/game/placeBets
http: exports.GamePlaceBets = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    const roundId = txnsGame[0].roundId;

    let spl = `SELECT credit, turnover, roundId, idplaygame, actiongamenow, bet_latest FROM member 
    WHERE phonenumber ='${usernameGame}' AND status_delete='N' ORDER BY phonenumber ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                //console.log(results)
                let status = 0;
                const balanceUser = parseFloat(results[0].credit);
                const betPlay = txnsGame[0].betAmount;
                const idbetPlay = txnsGame[0].id;
                if (balanceUser >= 0 && balanceUser >= betPlay) {
                    if (idbetPlay === results[0].idplaygame) {
                        res.status(201).json({
                            id: id,
                            statusCode: 20002,
                            timestampMillis: timestampMillis,
                            productId: productId,
                            action: "GameidbetPlay_ON",
                        });
                    } else if (roundId === results[0].roundId) {
                        if (productId === "918KISS" || productId === "NETENT2") {
                            let balanceNow = balanceUser - betPlay;
                            const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay + results[0].bet_latest}', idplaygame  = '${idbetPlay}',
                            actiongamenow ='placeBet', unsettleplay = 'N', winbonus ='N', roundId = '${roundId}' WHERE phonenumber ='${usernameGame}'`;
                            connection.query(sql_update, (error, resultsGame) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    res.status(201).json({
                                        username: usernameGame,
                                        currency: currency,
                                        timestampMillis: timestampMillis,
                                        balanceAfter: balanceNow,
                                        balanceBefore: balanceUser,
                                        id: id,
                                        statusCode: 0,
                                        productId: productId,
                                        action: "GamePlaceBets_ON",
                                    });
                                }
                            })
                        } else {
                            res.status(201).json({
                                id: id,
                                statusCode: 20002,
                                timestampMillis: timestampMillis,
                                productId: productId,
                                action: "GameroundId_ON",
                            });
                        }
                    } else {
                        if (betPlay <= 0) {
                            let balanceNow = balanceUser + betPlay;
                            const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}', idplaygame  = '${idbetPlay}',
                            actiongamenow ='placeBet', unsettleplay = 'N', winbonus ='N', roundId = '${roundId}' WHERE phonenumber ='${usernameGame}'`;
                            connection.query(sql_update, (error, resultsGame) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    res.status(201).json({
                                        id: id,
                                        statusCode: 0,
                                        timestampMillis: timestampMillis,
                                        productId: productId,
                                        currency: currency,
                                        username: usernameGame,
                                        balanceBefore: balanceUser,
                                        balanceAfter: balanceNow,
                                        action: "GamePlaceBets_ON",
                                    });
                                }
                            });
                        } else {
                            if (results[0].actiongamenow === 'cancelBetNoupdate') {
                                const sql_update = `UPDATE member set bet_latest='${betPlay}', idplaygame  = '${idbetPlay}',
                                actiongamenow ='placeBetNoupdate', unsettleplay = 'N', winbonus ='N', roundId = '${roundId}' WHERE phonenumber ='${usernameGame}'`;
                                connection.query(sql_update, (error, resultsGame) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        res.status(201).json({
                                            id: id,
                                            statusCode: 0,
                                            timestampMillis: timestampMillis,
                                            productId: productId,
                                            currency: currency,
                                            username: usernameGame,
                                            balanceBefore: balanceUser,
                                            balanceAfter: balanceUser,
                                            action: "GamePlaceBets_ON",
                                        });
                                    }
                                });
                            } else {
                                let balanceNow = balanceUser - betPlay;
                                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}', idplaygame  = '${idbetPlay}',
                                actiongamenow ='placeBet', unsettleplay = 'N', winbonus ='N', roundId = '${roundId}' WHERE phonenumber ='${usernameGame}'`;
                                connection.query(sql_update, (error, resultsGame) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        res.status(201).json({
                                            id: id,
                                            statusCode: 0,
                                            timestampMillis: timestampMillis,
                                            productId: productId,
                                            currency: currency,
                                            username: usernameGame,
                                            balanceBefore: balanceUser,
                                            balanceAfter: balanceNow,
                                            action: "GamePlaceBets_ON",
                                        });
                                    }
                                });
                            }
                        }
                    }
                } else {
                    balanceNow = 0;
                    status = 10002;
                    res.status(201).json({
                        id: id,
                        statusCode: 10002,
                        timestampMillis: timestampMillis,
                        productId: productId,
                        currency: currency,
                        balanceBefore: balanceUser,
                        balanceAfter: balanceNow,
                        username: usernameGame,
                        action: "PlaceBets_field",
                    });
                }
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};
//localhost:5000/post/game/settleBets
http: exports.GameSettleBets = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    const userAgent = req.headers["user-agent"];
    const userAgentt = req.useragent;
    const roundId = txnsGame[0].roundId;
    const betAmount = txnsGame[0].payoutAmount;
    const betPlay = txnsGame[0].betAmount;
    const idbetPlay = txnsGame[0].id;
    let splTest = `SELECT credit, roundId FROM member 
        WHERE phonenumber ='${usernameGame}' AND status_delete='N' AND roundId = '${roundId}' AND status = 'Y'`;
    try {
        connection.query(splTest, (error, resultsstart) => {
            if (error) {
                console.log(error);
            } else {
                if (productId === 'PGSOFT2' || productId === 'SPINIX') {
                    let splroundId = `SELECT roundId FROM repostgame WHERE roundId  ='${roundId}'`;
                    connection.query(splroundId, (error, resultsroundId) => {
                        if (error) {
                            console.log(error);
                        } else {
                            if (resultsroundId.length === 0) {
                                let spl = `SELECT credit, turnover, gameplayturn, playgameuser, tokenplaygame, bet_latest, idplaygame, actiongamenow FROM member 
                                    WHERE phonenumber ='${usernameGame}' AND status_delete='N' AND status = 'Y'`;
                                connection.query(spl, (error, results) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        if (results[0].actiongamenow === "cancelBet" || results[0].actiongamenow === "cancelFail") {
                                            const sql_update = `UPDATE member set bet_latest='${0.01}' WHERE phonenumber ='${usernameGame}'`;
                                            connection.query(sql_update, (error, resultsGame) => {
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    if (productId === 'SPINIX') {
                                                        if (results[0].actiongamenow === "cancelBet") {
                                                            res.status(201).json({
                                                                id: id,
                                                                statusCode: 20003,
                                                                productId: productId,
                                                                timestampMillis: timestampMillis,
                                                            });
                                                        } else {
                                                            res.status(201).json({
                                                                id: id,
                                                                statusCode: 20001,
                                                                productId: productId,
                                                                timestampMillis: timestampMillis,
                                                            });
                                                        }
                                                    } else {
                                                        res.status(201).json({
                                                            id: id,
                                                            statusCode: 20003,
                                                            timestampMillis: timestampMillis,
                                                            productId: productId,
                                                        });
                                                    }
                                                }
                                            });
                                        } else {
                                            const namegame = results[0].playgameuser;
                                            const balanceUser = parseFloat(results[0].credit);
                                            let status = 0;
                                            console.log(balanceUser, betAmount, betPlay, "GameSettleBets");
                                            if (balanceUser >= 0 && balanceUser >= betPlay) {
                                                if (betPlay === 0 && betAmount === betPlay) {
                                                    res.status(201).json({
                                                        id: id,
                                                        statusCode: 0,
                                                        timestampMillis: timestampMillis,
                                                        productId: productId,
                                                        currency: currency,
                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                        balanceAfter: convertToTwoDecimalPlaces(balanceUser),
                                                        username: usernameGame,
                                                        action: 'Settle>==4'
                                                    });
                                                } else {
                                                    if (results[0].idplaygame === idbetPlay) {
                                                        if (betAmount <= 0) {
                                                            let balanceNow = balanceUser - betAmount;
                                                            let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                            const post = {
                                                                username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                                userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                                roundId: roundId, balancebefore: balanceUser
                                                            };
                                                            let repost = repostGame.uploadLogRepostGame(post);
                                                            const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}',roundId = '${roundId}',
                                                                idplaygame = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                            connection.query(sql_update, (error, resultsGame) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                } else {
                                                                    res.status(201).json({
                                                                        id: id,
                                                                        statusCode: 0,
                                                                        timestampMillis: timestampMillis,
                                                                        productId: productId,
                                                                        currency: currency,
                                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                        balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                        username: usernameGame,
                                                                        action: 'Settle>==3'
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            //console.log(balanceUser, betPlay, betAmount, results[0].idplaygame, idbetPlay, "+NO");
                                                            let balanceNow = balanceUser + betAmount;
                                                            let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                            const post = {
                                                                username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                                userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                                roundId: roundId, balancebefore: balanceUser
                                                            };
                                                            let repost = repostGame.uploadLogRepostGame(post);
                                                            const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}', roundId = '${roundId}',
                                                                idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;
                                                            connection.query(sql_update, (error, resultsGame) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                } else {
                                                                    res.status(201).json({
                                                                        id: id,
                                                                        statusCode: 0,
                                                                        timestampMillis: timestampMillis,
                                                                        productId: productId,
                                                                        currency: currency,
                                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                        balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                        username: usernameGame,
                                                                        action: 'Settle>==2'
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    } else {
                                                        console.log(balanceUser, betPlay, betAmount, results[0].idplaygame, idbetPlay, "Yes");
                                                        let balanceNow = balanceUser - betPlay + betAmount;
                                                        let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest
                                                        );
                                                        //console.log("BetUp...." + betPlay, betAmount, balanceUser, balanceNow);
                                                        const post = {
                                                            username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                            userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                            roundId: roundId, balancebefore: balanceUser
                                                        };
                                                        let repost = repostGame.uploadLogRepostGame(post);
                                                        //console.log(balanceUser, balanceNow)
                                                        const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}',
                                                            roundId = '${roundId}', idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                        connection.query(sql_update, (error, resultsGame) => {
                                                            if (error) {
                                                                console.log(error);
                                                            } else {
                                                                res.status(201).json({
                                                                    id: id,
                                                                    statusCode: 0,
                                                                    timestampMillis: timestampMillis,
                                                                    productId: productId,
                                                                    currency: currency,
                                                                    balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                    balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                    username: usernameGame,
                                                                    action: 'Settle>==1'
                                                                });
                                                            }
                                                        });
                                                    }
                                                }
                                            } else if (betAmount !== 0 && balanceUser === 0) {
                                                if (results[0].idplaygame === idbetPlay) {
                                                    console.log(balanceUser, betPlay, betAmount, results[0].idplaygame, idbetPlay, "NO");
                                                    let balanceNow = balanceUser + betAmount;
                                                    let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                    const post = {
                                                        username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                        userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                        roundId: roundId, balancebefore: balanceUser
                                                    };
                                                    let repost = repostGame.uploadLogRepostGame(post);
                                                    const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}',
                                                        roundId = '${roundId}', idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                    connection.query(sql_update, (error, resultsGame) => {
                                                        if (error) {
                                                            console.log(error);
                                                        } else {
                                                            res.status(201).json({
                                                                id: id,
                                                                statusCode: 0,
                                                                timestampMillis: timestampMillis,
                                                                productId: productId,
                                                                currency: currency,
                                                                balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                username: usernameGame,
                                                                action: 'Settle>==0'
                                                            });
                                                        }
                                                    });
                                                }
                                            } else {
                                                status = 10002;
                                                res.status(201).json({
                                                    id: id,
                                                    statusCode: 10002,
                                                    timestampMillis: timestampMillis,
                                                    productId: productId,
                                                });
                                            }
                                        }
                                    }
                                });
                            } else {
                                let splTestRound = `SELECT credit, idplaygame FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N' AND status = 'Y'`;
                                connection.query(splTestRound, (error, resultRound) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        const balanceUser = parseFloat(resultRound[0].credit);
                                        let balanceNow = balanceUser + betAmount;
                                        if (productId === 'SPINIX') {
                                            if (resultRound[0].idplaygame === idbetPlay) {
                                                res.status(201).json({
                                                    tpyetest: "round = 4.2",
                                                    id: id,
                                                    statusCode: 20002,
                                                    timestampMillis: timestampMillis,
                                                    productId: productId,
                                                });
                                            } else {
                                                const sql_update = `UPDATE member set credit='${balanceNow}',roundId = '${roundId}',
                                                actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;
                                                connection.query(sql_update, (error, resultsGame) => {
                                                    if (error) {
                                                        console.log(error);
                                                    } else {
                                                        res.status(201).json({
                                                            tpyetest: "round = 5",
                                                            id: id,
                                                            statusCode: 0,
                                                            timestampMillis: timestampMillis,
                                                            productId: productId,
                                                            currency: currency,
                                                            balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                            balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                            username: usernameGame,
                                                        });
                                                    }
                                                })
                                            }
                                        } else {
                                            res.status(201).json({
                                                tpyetest: "round = 4",
                                                id: id,
                                                statusCode: 0,
                                                timestampMillis: timestampMillis,
                                                productId: productId,
                                                currency: currency,
                                                balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                balanceAfter: convertToTwoDecimalPlaces(balanceUser),
                                                username: usernameGame,
                                            });
                                        }
                                    }
                                })
                            }
                        }
                    });
                } else if (productId === 'I8') {
                    let splroundId = `SELECT roundId FROM repostgame WHERE roundId  ='${roundId}'`;
                    connection.query(splroundId, (error, resultsroundId) => {
                        if (error) {
                            console.log(error);
                        } else {
                            if (resultsroundId.length === 0) {
                                let spl = `SELECT credit, turnover, gameplayturn, playgameuser, tokenplaygame, bet_latest, idplaygame, actiongamenow FROM member 
                                    WHERE phonenumber ='${usernameGame}' AND status_delete='N' AND status = 'Y'`;
                                connection.query(spl, (error, results) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        if (results[0].actiongamenow === "cancelBet" || results[0].actiongamenow === "cancelFail") {
                                            const sql_update = `UPDATE member set bet_latest='${0.01}' WHERE phonenumber ='${usernameGame}'`;
                                            connection.query(sql_update, (error, resultsGame) => {
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    if (productId === 'I8') {
                                                        if (results[0].actiongamenow === "cancelBet") {
                                                            res.status(201).json({
                                                                id: id,
                                                                statusCode: 20003,
                                                                productId: productId,
                                                                timestampMillis: timestampMillis,
                                                            });
                                                        } else {
                                                            res.status(201).json({
                                                                id: id,
                                                                statusCode: 20001,
                                                                productId: productId,
                                                                timestampMillis: timestampMillis,
                                                            });
                                                        }
                                                    } else {
                                                        res.status(201).json({
                                                            id: id,
                                                            statusCode: 20003,
                                                            timestampMillis: timestampMillis,
                                                            productId: productId,
                                                        });
                                                    }
                                                }
                                            });
                                        } else {
                                            const namegame = results[0].playgameuser;
                                            const balanceUser = parseFloat(results[0].credit);
                                            if (balanceUser >= 0 && balanceUser >= betPlay) {
                                                if (betPlay === 0 && betAmount === betPlay) {
                                                    res.status(201).json({
                                                        id: id,
                                                        statusCode: 0,
                                                        timestampMillis: timestampMillis,
                                                        productId: productId,
                                                        currency: currency,
                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                        balanceAfter: convertToTwoDecimalPlaces(balanceUser),
                                                        username: usernameGame,
                                                        action: 'Settle>==4'
                                                    });
                                                } else {
                                                    if (results[0].idplaygame === idbetPlay) {
                                                        if (betAmount <= 0) {
                                                            let balanceNow = balanceUser - betAmount;
                                                            let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                            const post = {
                                                                username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                                userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                                roundId: roundId, balancebefore: balanceUser
                                                            };
                                                            let repost = repostGame.uploadLogRepostGame(post);
                                                            const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}',roundId = '${roundId}',
                                                                idplaygame = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                            connection.query(sql_update, (error, resultsGame) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                } else {
                                                                    res.status(201).json({
                                                                        id: id,
                                                                        statusCode: 0,
                                                                        timestampMillis: timestampMillis,
                                                                        productId: productId,
                                                                        currency: currency,
                                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                        balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                        username: usernameGame,
                                                                        action: 'Settle>==3'
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            let balanceNow = balanceUser + betAmount;
                                                            let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                            const post = {
                                                                username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                                userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                                roundId: roundId, balancebefore: balanceUser
                                                            };
                                                            let repost = repostGame.uploadLogRepostGame(post);
                                                            const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}', roundId = '${roundId}',
                                                                idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;
                                                            connection.query(sql_update, (error, resultsGame) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                } else {
                                                                    res.status(201).json({
                                                                        id: id,
                                                                        statusCode: 0,
                                                                        timestampMillis: timestampMillis,
                                                                        productId: productId,
                                                                        currency: currency,
                                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                        balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                        username: usernameGame,
                                                                        action: 'Settle>==2'
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    } else {
                                                        if (results[0].actiongamenow === 'cancelBetVoidNotUpdate') {
                                                            const sql_update = `UPDATE member set roundId = '${roundId}', idplaygame  = '${idbetPlay}', 
                                                            actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;
                                                            connection.query(sql_update, (error, resultsGame) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                } else {
                                                                    res.status(201).json({
                                                                        id: id,
                                                                        statusCode: 0,
                                                                        timestampMillis: timestampMillis,
                                                                        productId: productId,
                                                                        currency: currency,
                                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                        balanceAfter: convertToTwoDecimalPlaces(balanceUser),
                                                                        username: usernameGame,
                                                                        action: 'Settle>==1.5'
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            let balanceNow = balanceUser - betPlay + betAmount;
                                                            let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest
                                                            );
                                                            const post = {
                                                                username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                                userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                                roundId: roundId, balancebefore: balanceUser
                                                            };
                                                            let repost = repostGame.uploadLogRepostGame(post);
                                                            const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}', 
                                                                roundId = '${roundId}', idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                            connection.query(sql_update, (error, resultsGame) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                } else {
                                                                    res.status(201).json({
                                                                        id: id,
                                                                        statusCode: 0,
                                                                        timestampMillis: timestampMillis,
                                                                        productId: productId,
                                                                        currency: currency,
                                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                        balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                        username: usernameGame,
                                                                        action: 'Settle>==1'
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                }
                                            } else if (betAmount !== 0 && balanceUser === 0) {
                                                if (results[0].idplaygame === idbetPlay) {
                                                    let balanceNow = balanceUser + betAmount;
                                                    let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                    const post = {
                                                        username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                        userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                        roundId: roundId, balancebefore: balanceUser
                                                    };
                                                    let repost = repostGame.uploadLogRepostGame(post);
                                                    const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}',
                                                        roundId = '${roundId}', idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                    connection.query(sql_update, (error, resultsGame) => {
                                                        if (error) {
                                                            console.log(error);
                                                        } else {
                                                            res.status(201).json({
                                                                id: id,
                                                                statusCode: 0,
                                                                timestampMillis: timestampMillis,
                                                                productId: productId,
                                                                currency: currency,
                                                                balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                username: usernameGame,
                                                                action: 'Settle>==0'
                                                            });
                                                        }
                                                    });
                                                }
                                            } else {
                                                status = 10002;
                                                res.status(201).json({
                                                    id: id,
                                                    statusCode: 10002,
                                                    timestampMillis: timestampMillis,
                                                    productId: productId,
                                                });
                                            }
                                        }
                                    }
                                });
                            } else {
                                let splTestRound = `SELECT credit, idplaygame FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N' AND status = 'Y'`;
                                connection.query(splTestRound, (error, resultRound) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        const balanceUser = parseFloat(resultRound[0].credit);
                                        let amount = 0
                                        for (let i = 0; i < txnsGame.length; i++) {
                                            amount += txnsGame[i].payoutAmount
                                        }
                                        let balanceNow = balanceUser + amount;
                                        if (productId === 'I8') {
                                            if (resultRound[0].idplaygame === idbetPlay) {
                                                res.status(201).json({
                                                    tpyetest: "round = 4.2",
                                                    id: id,
                                                    statusCode: 20002,
                                                    timestampMillis: timestampMillis,
                                                    productId: productId,
                                                });
                                            } else {
                                                const sql_update = `UPDATE member set credit='${balanceNow}',roundId = '${roundId}',
                                                actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;
                                                connection.query(sql_update, (error, resultsGame) => {
                                                    if (error) {
                                                        console.log(error);
                                                    } else {
                                                        res.status(201).json({
                                                            tpyetest: "round = 5",
                                                            id: id,
                                                            statusCode: 0,
                                                            timestampMillis: timestampMillis,
                                                            productId: productId,
                                                            currency: currency,
                                                            balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                            balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                            username: usernameGame,
                                                        });
                                                    }
                                                })
                                            }
                                        } else {
                                            res.status(201).json({
                                                tpyetest: "round = 4",
                                                id: id,
                                                statusCode: 0,
                                                timestampMillis: timestampMillis,
                                                productId: productId,
                                                currency: currency,
                                                balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                balanceAfter: convertToTwoDecimalPlaces(balanceUser),
                                                username: usernameGame,
                                            });
                                        }
                                    }
                                })
                            }
                        }
                    });
                } else {
                    if (resultsstart.length <= 0) {
                        let splTestRound = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N' AND status = 'Y'`;
                        connection.query(splTestRound, (error, resultRound) => {
                            if (error) {
                                console.log(error);
                            } else {
                                const balanceUser = parseFloat(resultRound[0].credit);
                                if (productId === "CQ9V2" || productId === "ACE333") {
                                    res.status(201).json({
                                        tpyetest: "round = 2",
                                        id: id,
                                        statusCode: 20002,
                                        timestampMillis: timestampMillis,
                                        productId: productId,
                                    });
                                } else if (productId === "918KISS" || productId === 'REDTIGER') {
                                    res.status(201).json({
                                        tpyetest: "round = 3",
                                        id: id,
                                        statusCode: 20001,
                                        timestampMillis: timestampMillis,
                                        productId: productId,
                                        balanceAfter: convertToTwoDecimalPlaces(balanceUser),
                                    });
                                } else {
                                    res.status(201).json({
                                        tpyetest: "round = 1",
                                        id: id,
                                        statusCode: 0,
                                        timestampMillis: timestampMillis,
                                        productId: productId,
                                        currency: currency,
                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                        balanceAfter: convertToTwoDecimalPlaces(balanceUser),
                                        username: usernameGame,
                                    });
                                }
                            }
                        });
                    } else {
                        let splroundId = `SELECT roundId FROM repostgame WHERE roundId  ='${roundId}'`;
                        connection.query(splroundId, (error, resultsroundId) => {
                            if (error) {
                                console.log(error);
                            } else {
                                if (resultsroundId.length === 0) {
                                    let spl = `SELECT credit, turnover, gameplayturn, playgameuser, tokenplaygame, bet_latest, idplaygame, actiongamenow FROM member 
                                    WHERE phonenumber ='${usernameGame}' AND status_delete='N' AND status = 'Y'`;
                                    connection.query(spl, (error, results) => {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            if (results[0].actiongamenow === "cancelBet") {
                                                const sql_update = `UPDATE member set bet_latest='${0.01}' WHERE phonenumber ='${usernameGame}'`;
                                                connection.query(sql_update, (error, resultsGame) => {
                                                    if (error) {
                                                        console.log(error);
                                                    } else {
                                                        res.status(201).json({
                                                            id: id,
                                                            statusCode: 20003,
                                                            timestampMillis: timestampMillis,
                                                            productId: productId,
                                                        });
                                                    }
                                                });
                                            } else {
                                                const namegame = results[0].playgameuser;
                                                const balanceUser = parseFloat(results[0].credit);
                                                const idbetPlay = txnsGame[0].id;
                                                let status = 0;
                                                console.log(balanceUser, betAmount, betPlay, "GameSettleBets");
                                                if (balanceUser >= 0 && balanceUser >= betPlay) {
                                                    if (betPlay === 0 && betAmount === betPlay) {
                                                        res.status(201).json({
                                                            id: id,
                                                            statusCode: 0,
                                                            timestampMillis: timestampMillis,
                                                            productId: productId,
                                                            currency: currency,
                                                            balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                            balanceAfter: convertToTwoDecimalPlaces(balanceUser),
                                                            username: usernameGame,
                                                            action: 'Settle>==4'
                                                        });
                                                    } else {
                                                        if (results[0].idplaygame === idbetPlay) {
                                                            if (betAmount <= 0) {
                                                                let balanceNow = balanceUser - betAmount;
                                                                let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                                const post = {
                                                                    username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                                    userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                                    roundId: roundId, balancebefore: balanceUser
                                                                };
                                                                let repost = repostGame.uploadLogRepostGame(post);
                                                                const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}',roundId = '${roundId}',
                                                                idplaygame = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                                connection.query(sql_update, (error, resultsGame) => {
                                                                    if (error) {
                                                                        console.log(error);
                                                                    } else {
                                                                        res.status(201).json({
                                                                            id: id,
                                                                            statusCode: 0,
                                                                            timestampMillis: timestampMillis,
                                                                            productId: productId,
                                                                            currency: currency,
                                                                            balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                            balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                            username: usernameGame,
                                                                            action: 'Settle>==3'
                                                                        });
                                                                    }
                                                                });
                                                            } else {
                                                                //console.log(balanceUser, betPlay, betAmount, results[0].idplaygame, idbetPlay, "+NO");
                                                                let balanceNow = balanceUser + betAmount;
                                                                let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                                const post = {
                                                                    username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                                    userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                                    roundId: roundId, balancebefore: balanceUser
                                                                };
                                                                let repost = repostGame.uploadLogRepostGame(post);
                                                                const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}', roundId = '${roundId}',
                                                                idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;
                                                                connection.query(sql_update, (error, resultsGame) => {
                                                                    if (error) {
                                                                        console.log(error);
                                                                    } else {
                                                                        res.status(201).json({
                                                                            id: id,
                                                                            statusCode: 0,
                                                                            timestampMillis: timestampMillis,
                                                                            productId: productId,
                                                                            currency: currency,
                                                                            balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                            balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                            username: usernameGame,
                                                                            action: 'Settle>==2'
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            console.log(balanceUser, betPlay, betAmount, results[0].idplaygame, idbetPlay, "Yes");
                                                            let balanceNow = balanceUser - betPlay + betAmount;
                                                            let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest
                                                            );
                                                            //console.log("BetUp...." + betPlay, betAmount, balanceUser, balanceNow);
                                                            const post = {
                                                                username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                                userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                                roundId: roundId, balancebefore: balanceUser
                                                            };
                                                            let repost = repostGame.uploadLogRepostGame(post);
                                                            //console.log(balanceUser, balanceNow)
                                                            const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}',
                                                            roundId = '${roundId}', idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                            connection.query(sql_update, (error, resultsGame) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                } else {
                                                                    res.status(201).json({
                                                                        id: id,
                                                                        statusCode: 0,
                                                                        timestampMillis: timestampMillis,
                                                                        productId: productId,
                                                                        currency: currency,
                                                                        balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                        balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                        username: usernameGame,
                                                                        action: 'Settle>==1'
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                } else if (betAmount !== 0 && balanceUser === 0) {
                                                    if (results[0].idplaygame === idbetPlay) {
                                                        console.log(balanceUser, betPlay, betAmount, results[0].idplaygame, idbetPlay, "NO");
                                                        let balanceNow = balanceUser + betAmount;
                                                        let balanceturnover = hasSimilarData(results[0].gameplayturn, productId, results[0].turnover, results[0].bet_latest);
                                                        const post = {
                                                            username: usernameGame, gameid: productId, bet: results[0].bet_latest, win: betAmount, balance_credit: balanceNow,
                                                            userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: txnsGame[0].tokenplaygame,
                                                            roundId: roundId, balancebefore: balanceUser
                                                        };
                                                        let repost = repostGame.uploadLogRepostGame(post);
                                                        const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}',
                                                        roundId = '${roundId}', idplaygame  = '${idbetPlay}', actiongamenow ='settleBet' WHERE phonenumber ='${usernameGame}'`;

                                                        connection.query(sql_update, (error, resultsGame) => {
                                                            if (error) {
                                                                console.log(error);
                                                            } else {
                                                                res.status(201).json({
                                                                    id: id,
                                                                    statusCode: 0,
                                                                    timestampMillis: timestampMillis,
                                                                    productId: productId,
                                                                    currency: currency,
                                                                    balanceBefore: convertToTwoDecimalPlaces(balanceUser),
                                                                    balanceAfter: convertToTwoDecimalPlaces(balanceNow),
                                                                    username: usernameGame,
                                                                    action: 'Settle>==0'
                                                                });
                                                            }
                                                        });
                                                    }
                                                } else {
                                                    status = 10002;
                                                    res.status(201).json({
                                                        id: id,
                                                        statusCode: 10002,
                                                        timestampMillis: timestampMillis,
                                                        productId: productId,
                                                    });
                                                }
                                            }
                                        }
                                    });
                                } else {
                                    res.status(201).json({
                                        tpyetest: "round = 4",
                                        id: id,
                                        statusCode: 20002,
                                        timestampMillis: timestampMillis,
                                        productId: productId,
                                        balanceAfter: convertToTwoDecimalPlaces(resultsstart[0].credit),
                                    });
                                }
                            }
                        });
                    }
                }
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/game/cancelBets
http: exports.GameCancelBets = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    const roundId = txnsGame[0].roundId
    let spl = `SELECT credit, bet_latest, actiongamenow, roundId FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                const betPlay = txnsGame[0].betAmount;
                if (results[0].bet_latest === 0 || results[0].bet_latest === 0.0) {
                    if (results[0].actiongamenow !== "settleBet") {
                        if (productId === "918KISS" || productId === "ACE333") {
                            if (roundId === results[0].roundId) {
                                res.status(201).json({
                                    id: id,
                                    statusCode: 20002,
                                    timestampMillis: timestampMillis,
                                    productId: productId,
                                    action: 'Cbet>==/*0'
                                });
                            } else {
                                res.status(201).json({
                                    id: id,
                                    statusCode: 0,
                                    timestampMillis: timestampMillis,
                                    productId: productId,
                                    currency: currency,
                                    balanceBefore: balanceUser,
                                    balanceAfter: balanceUser,
                                    username: usernameGame,
                                    action: 'cancelBetActionV'
                                });
                            }
                        } else if (productId === "CQ9V2" || productId === "NETENT2") {
                            if (roundId === results[0].roundId) {
                                res.status(201).json({
                                    id: id,
                                    statusCode: 20002,
                                    timestampMillis: timestampMillis,
                                    productId: productId,
                                    action: 'Cbet>==/*0CQ9V2'
                                });
                            } else {
                                const sql_updateaction = `UPDATE member set actiongamenow ='cancelBetNoupdate' WHERE phonenumber ='${usernameGame}'`;
                                connection.query(sql_updateaction, (error, resultsGame) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        res.status(201).json({
                                            id: id,
                                            statusCode: 0,
                                            timestampMillis: timestampMillis,
                                            productId: productId,
                                            currency: currency,
                                            balanceBefore: balanceUser,
                                            balanceAfter: balanceUser,
                                            username: usernameGame,
                                            action: 'cancelBetActionVCQ9V2'
                                        });
                                    }
                                })
                            }
                        } else if (productId === "REDTIGER" || productId === "SPINIX") {
                            if (roundId === results[0].roundId) {
                                const sql_updateaction = `UPDATE member set actiongamenow ='cancelFail' WHERE phonenumber ='${usernameGame}'`;
                                connection.query(sql_updateaction, (error, resultsGame) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        res.status(201).json({
                                            id: id,
                                            statusCode: 20002,
                                            timestampMillis: timestampMillis,
                                            productId: productId,
                                            action: 'Cbet>==/*REDTIGER'
                                        });
                                    }
                                })
                            } else {
                                const sql_updateaction = `UPDATE member set actiongamenow ='cancelBetNoupdate' WHERE phonenumber ='${usernameGame}'`;
                                connection.query(sql_updateaction, (error, resultsGame) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        res.status(201).json({
                                            id: id,
                                            statusCode: 0,
                                            timestampMillis: timestampMillis,
                                            productId: productId,
                                            currency: currency,
                                            balanceBefore: balanceUser,
                                            balanceAfter: balanceUser,
                                            username: usernameGame,
                                            action: 'cancelBetActionREDTIGER'
                                        });
                                    }
                                })
                            }
                        } else {
                            res.status(201).json({
                                id: id,
                                statusCode: 0,
                                timestampMillis: timestampMillis,
                                productId: productId,
                                currency: currency,
                                balanceBefore: balanceUser,
                                balanceAfter: balanceUser,
                                username: usernameGame,
                                action: 'cancelBetActionVI'
                            });
                        }
                    }
                } else if (results[0].actiongamenow === "settleBet" || results[0].actiongamenow === "settleBetWin") {
                    if (productId === "918KISS") {
                        let splroundId = `SELECT balancebefore, balance_credit, bet FROM repostgame WHERE roundId  ='${roundId}'`;
                        connection.query(splroundId, (error, resultsroundId) => {
                            if (error) {
                                console.log(error);
                            } else {
                                const sql_update = `UPDATE member set credit='${resultsroundId[0].balancebefore}',bet_latest='${0.0}', actiongamenow ='cancelBet'
                                WHERE phonenumber ='${usernameGame}'`;
                                connection.query(sql_update, (error, resultsGame) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        res.status(201).json({
                                            id: id,
                                            statusCode: 0,
                                            timestampMillis: timestampMillis,
                                            productId: productId,
                                            currency: currency,
                                            balanceBefore: resultsroundId[0].balance_credit,
                                            balanceAfter: resultsroundId[0].balancebefore + resultsroundId[0].bet,
                                            username: usernameGame,
                                            action: 'Cbet>==0'
                                        });
                                    }
                                });
                            }
                        })
                    } else {
                        if (productId === "SPINIX") {
                            if (results[0].roundId === roundId) {
                                res.status(201).json({
                                    id: id,
                                    statusCode: 20004,
                                    timestampMillis: timestampMillis,
                                    productId: productId,
                                });
                            } else {
                                const sql_updateaction = `UPDATE member set actiongamenow ='cancelBetNoupdate' WHERE phonenumber ='${usernameGame}'`;
                                connection.query(sql_updateaction, (error, resultsGame) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        res.status(201).json({
                                            id: id,
                                            statusCode: 0,
                                            timestampMillis: timestampMillis,
                                            productId: productId,
                                            currency: currency,
                                            balanceBefore: balanceUser,
                                            balanceAfter: balanceUser,
                                            username: usernameGame,
                                            action: 'cancelBetNoAction'
                                        });
                                    }
                                });
                            }
                        } else {
                            res.status(201).json({
                                id: id,
                                statusCode: 20004,
                                timestampMillis: timestampMillis,
                                productId: productId,
                            });
                        }
                    }
                } else if (results[0].actiongamenow === "cancelBet") {
                    const sql_updateaction = `UPDATE member set actiongamenow ='cancelBetNoupdate' WHERE phonenumber ='${usernameGame}'`;
                    connection.query(sql_updateaction, (error, resultsGame) => {
                        if (error) {
                            console.log(error);
                        } else {
                            res.status(201).json({
                                id: id,
                                statusCode: 0,
                                timestampMillis: timestampMillis,
                                productId: productId,
                                currency: currency,
                                balanceBefore: balanceUser,
                                balanceAfter: balanceUser,
                                username: usernameGame,
                                action: 'cancelBetAction'
                            });
                        }
                    });
                } else {
                    if (betPlay < 0) {
                        const balanceNow = balanceUser + results[0].bet_latest;
                        const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${0.0}', actiongamenow ='cancelBet'
                        WHERE phonenumber ='${usernameGame}'`;
                        connection.query(sql_update, (error, resultsGame) => {
                            if (error) {
                                console.log(error);
                            } else {
                                res.status(201).json({
                                    id: id,
                                    statusCode: 0,
                                    timestampMillis: timestampMillis,
                                    productId: productId,
                                    currency: currency,
                                    balanceBefore: balanceUser,
                                    balanceAfter: balanceNow,
                                    username: usernameGame,
                                    action: 'Cbet<0'
                                });
                            }
                        });
                    } else {
                        if (results[0].roundId === roundId) {
                            const balanceNow = balanceUser + results[0].bet_latest;
                            const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${0.0}', actiongamenow ='cancelBet'
                            WHERE phonenumber ='${usernameGame}'`;
                            connection.query(sql_update, (error, resultsGame) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    res.status(201).json({
                                        id: id,
                                        statusCode: 0,
                                        timestampMillis: timestampMillis,
                                        productId: productId,
                                        currency: currency,
                                        balanceBefore: balanceUser,
                                        balanceAfter: balanceNow,
                                        username: usernameGame,
                                        action: 'Cbet>=0'
                                    });
                                }
                            });
                        } else {
                            const sql_update = `UPDATE member set bet_latest='${0.0}', actiongamenow ='cancelBetNoupdate'
                            WHERE phonenumber ='${usernameGame}'`;
                            connection.query(sql_update, (error, resultsGame) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    res.status(201).json({
                                        id: id,
                                        statusCode: 0,
                                        timestampMillis: timestampMillis,
                                        productId: productId,
                                        currency: currency,
                                        balanceBefore: balanceUser,
                                        balanceAfter: balanceUser,
                                        username: usernameGame,
                                        action: 'Cbet>=Not'
                                    });
                                }
                            })
                        }
                    }
                }
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/game/adjustBets
http: exports.GameAdjustBets = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    //username = 'member001';
    let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                const betPlay = txnsGame[0].betAmount;
                const balanceNow = balanceUser - betPlay;
                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${txnsGame[0].betAmount}' WHERE phonenumber ='${usernameGame}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) {
                        console.log(error);
                    } else {
                        res.status(201).json({
                            id: id,
                            statusCode: 0,
                            timestampMillis: timestampMillis,
                            productId: productId,
                            currency: currency,
                            balanceBefore: balanceUser,
                            balanceAfter: balanceNow,
                            username: usernameGame,
                        });
                    }
                });
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/game/unsettleBets
http: exports.GameUnsettleBets = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    const payoutAmount = txnsGame[0].payoutAmount;
    const roundId = txnsGame[0].roundId;
    let spl = `SELECT credit, tokenplaygame, unsettleplay FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                if (results[0].unsettleplay === 'N') {
                    const balanceUser = parseFloat(results[0].credit);
                    let balanceAfter = balanceUser - payoutAmount;
                    const deleteQuery = `DELETE FROM repostgame WHERE roundId  ='${roundId}'`;
                    const sql_update = `UPDATE member set credit='${balanceAfter}',bet_latest='${txnsGame[0].betAmount}',
                    unsettleplay = 'Y' WHERE phonenumber ='${usernameGame}'`;
                    connection.query(deleteQuery, (error, resultsdelete) => {
                        if (error) {
                            console.log(error);
                        } else {
                            connection.query(sql_update, (error, resultsgg) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    res.status(201).json({
                                        id: id,
                                        statusCode: 0,
                                        timestampMillis: timestampMillis,
                                        productId: productId,
                                        currency: currency,
                                        balanceBefore: balanceUser,
                                        balanceAfter: balanceAfter,
                                        username: usernameGame,
                                    });
                                }
                            });
                        }
                    });
                } else {
                    res.status(201).json({
                        id: id,
                        statusCode: 20002,
                        timestampMillis: timestampMillis,
                        productId: productId,
                    });
                }
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/game/winRewards
http: exports.GameWinRewards = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    const roundId = txnsGame[0].roundId;
    let spl = `SELECT credit, roundId, unsettleplay, winbonus FROM member 
        WHERE phonenumber ='${usernameGame}' AND status_delete='N' AND status = 'Y'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                const betPlay = txnsGame[0].betAmount;
                const betpayoutAmount = txnsGame[0].payoutAmount;
                const balanceNow = balanceUser + betpayoutAmount;

                if (roundId === results[0].roundId) {
                    if (results[0].unsettleplay === 'Y') {
                        const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}',
                        roundId = '${roundId}', winbonus ='Y' WHERE phonenumber ='${usernameGame}'`;
                        connection.query(sql_update, (error, resultsGame) => {
                            if (error) {
                                console.log(error);
                            } else {
                                res.status(201).json({
                                    username: usernameGame,
                                    id: id,
                                    statusCode: 0,
                                    timestampMillis: timestampMillis,
                                    productId: productId,
                                    currency: currency,
                                    balanceBefore: balanceUser,
                                    balanceAfter: balanceNow,
                                });
                            }
                        });
                    } else if (results[0].winbonus === 'N' && results[0].unsettleplay === 'N') {
                        const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}',
                        roundId = '${roundId}', winbonus ='Y' WHERE phonenumber ='${usernameGame}'`;
                        connection.query(sql_update, (error, resultsGame) => {
                            if (error) {
                                console.log(error);
                            } else {
                                res.status(201).json({
                                    username: usernameGame,
                                    id: id,
                                    statusCode: 0,
                                    timestampMillis: timestampMillis,
                                    productId: productId,
                                    currency: currency,
                                    balanceBefore: balanceUser,
                                    balanceAfter: balanceNow,
                                });
                            }
                        });
                    } else {
                        res.status(201).json({
                            id: id,
                            statusCode: 20002,
                            timestampMillis: timestampMillis,
                            productId: productId,
                        });
                    }
                } else {
                    const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}',
                    roundId = '${roundId}', winbonus ='Y' WHERE phonenumber ='${usernameGame}'`;
                    connection.query(sql_update, (error, resultsGame) => {
                        if (error) {
                            console.log(error);
                        } else {
                            res.status(201).json({
                                username: usernameGame,
                                id: id,
                                statusCode: 0,
                                timestampMillis: timestampMillis,
                                productId: productId,
                                currency: currency,
                                balanceBefore: balanceUser,
                                balanceAfter: balanceNow,
                            });
                        }
                    });
                }
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/game/placeTips
http: exports.GamePayTips = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    username = "member001";
    let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                const betPlay = txnsGame[0].betAmount;
                const balanceNow = balanceUser - betPlay;
                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}' WHERE phonenumber ='${usernameGame}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) {
                        console.log(error);
                    } else {
                        res.status(201).json({
                            id: id,
                            statusCode: 0,
                            timestampMillis: timestampMillis,
                            productId: productId,
                            currency: currency,
                            balanceBefore: balanceUser,
                            balanceAfter: balanceNow,
                            username: usernameGame,
                        });
                    }
                });
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/game/cancelTips
http: exports.GameTipsCancel = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                const betPlay = txnsGame[0].betAmount;
                const payoutAmount = txnsGame[0].payoutAmount;
                const balanceNow = balanceUser + betPlay;
                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}' WHERE phonenumber ='${usernameGame}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) {
                        console.log(error);
                    } else {
                        res.status(201).json({
                            id: id,
                            statusCode: 0,
                            timestampMillis: timestampMillis,
                            productId: productId,
                            currency: currency,
                            balanceBefore: balanceUser,
                            balanceAfter: balanceNow,
                            username: usernameGame,
                            action: 'GameTipsCancel'
                        });
                    }
                });
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/game/voidBets
http: exports.GameVoidBets = async (req, res) => {
    const id = req.body.id;
    const timestampMillis = req.body.timestampMillis;
    const productId = req.body.productId;
    const currency = req.body.currency;
    const usernameGame = req.body.username;
    const txnsGame = req.body.txns;
    const roundId = txnsGame[0].roundId;
    let spl = `SELECT credit, bet_latest, actiongamenow, roundId FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                if (results[0].actiongamenow === 'cancelBetVoid') {
                    if (results[0].roundId === roundId) {
                        res.status(201).json({
                            id: id,
                            statusCode: 20002,
                            timestampMillis: timestampMillis,
                            productId: productId,
                        });
                    } else {
                        const balanceUser = parseFloat(results[0].credit);
                        const sql_update = `UPDATE member set actiongamenow = 'cancelBetVoidNotUpdate' WHERE phonenumber ='${usernameGame}'`;
                        connection.query(sql_update, (error, resultsGame) => {
                            if (error) {
                                console.log(error);
                            } else {
                                res.status(201).json({
                                    id: id,
                                    statusCode: 0,
                                    timestampMillis: timestampMillis,
                                    productId: productId,
                                    currency: currency,
                                    balanceBefore: balanceUser,
                                    balanceAfter: balanceUser,
                                    username: usernameGame,
                                    action: 'GameVoidBetsIdrood'
                                });
                            }
                        });
                    }
                } else {
                    const balanceUser = parseFloat(results[0].credit);
                    const betPlay = txnsGame[0].betAmount;
                    const betpayoutAmount = txnsGame[0].payoutAmount;
                    const balanceNow = balanceUser - (betpayoutAmount - betPlay);
                    const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}', actiongamenow = 'cancelBetVoid'
                    WHERE phonenumber ='${usernameGame}'`;
                    connection.query(sql_update, (error, resultsGame) => {
                        if (error) {
                            console.log(error);
                        } else {
                            res.status(201).json({
                                id: id,
                                statusCode: 0,
                                timestampMillis: timestampMillis,
                                productId: productId,
                                currency: currency,
                                balanceBefore: balanceUser,
                                balanceAfter: balanceNow,
                                username: usernameGame,
                                action: 'GameVoidBets'
                            });
                        }
                    });
                }

            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

/*------------------------------------------------------------------------------------------------------------------*/
//localhost:5000/post/CQ9/transaction/balance/:account
http: exports.GameCheckBalanceCQ9 = async (req, res) => {
    const usernameGame = req.params.account;
    const today = new Date();
    let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                res.status(201).json({
                    data: {
                        balance: balanceUser,
                        currency: "THB",
                    },
                    status: {
                        code: "0",
                        message: "Success",
                        datetime: today,
                    },
                });
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/CQ9/transaction/game/bet
http: exports.GameBetCQ9 = async (req, res) => {
    const usernameGame = req.body.account;
    const amount = req.body.amount;
    const eventTime = req.body.eventTime;
    const gamecode = req.body.gamecode;
    const gamehall = req.body.gamehall;
    const mtcode = req.body.mtcode;
    const platform = req.body.platform;
    const roundid = req.body.roundid;
    const userAgent = req.headers["user-agent"];
    let spl = `SELECT credit, playgameuser FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                const amountGame = parseFloat(amount);
                const balanceNow = balanceUser - amountGame;
                const namegame = results[0].playgameuser;
                const post = {
                    username: usernameGame, gameid: "CQ9V2",
                    bet: amountGame,
                    win: 0,
                    balance_credit: balanceNow,
                    userAgent: userAgent,
                    platform: userAgent,
                    trans_id: mtcode,
                    namegame: namegame,
                    roundId: roundid,
                    balancebefore: balanceUser
                };
                let repost = repostGame.uploadLogRepostGameAsk(post);

                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${amountGame}' WHERE phonenumber ='${usernameGame}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) {
                        console.log(error);
                    } else {
                        res.status(201).json({
                            data: {
                                balance: balanceNow,
                                currency: "THB",
                            },
                            status: {
                                code: "0",
                                message: "Success",
                                datetime: eventTime,
                            },
                        });
                    }
                });
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/CQ9/transaction/game/endround
http: exports.GameEndRoundCQ9 = async (req, res) => {
    const usernameGame = req.body.account;
    const createTime = req.body.createTime;
    const gamecode = req.body.gamecode;
    const gamehall = req.body.gamehall;
    const platform = req.body.platform;
    const roundid = req.body.roundid;
    const userAgent = req.headers["user-agent"];
    const jsonString = req.body.data;
    const jsonObject = JSON.parse(jsonString);
    const dataArray = JSON.parse(jsonObject.data);
    const mtcode = dataArray[0].mtcode;
    const amount = dataArray[0].amount;
    const eventtime = dataArray[0].eventtime;
    const validbet = dataArray[0].validbet;

    let spl = `SELECT credit, bet_latest FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                const amountGame = parseFloat(amount);
                const balanceNow = balanceUser + amountGame;

                const post = {
                    username: usernameGame,
                    gameid: "CQ9V2",
                    bet: results[0].bet_latest,
                    win: amountGame,
                    balance_credit: balanceNow,
                    userAgent: userAgent,
                    platform: userAgent,
                    trans_id: mtcode,
                    roundId: roundid,
                    balancebefore: balanceUser
                };
                let repost = repostGame.uploadLogRepostGameAsk(post);

                const sql_update = `UPDATE member set credit='${balanceNow}' WHERE phonenumber ='${usernameGame}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) {
                        console.log(error);
                    } else {
                        res.status(201).json({
                            data: {
                                balance: balanceNow,
                                currency: "THB",
                            },
                            status: {
                                code: "0",
                                message: "Success",
                                datetime: createTime,
                            },
                        });
                    }
                });
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/CQ9/transaction/game/rollout
http: exports.GameRolloutCQ9 = async (req, res) => {
    const usernameGame = req.body.account;
    const amount = req.body.amount;
    const eventTime = req.body.eventTime;
    const gamecode = req.body.gamecode;
    const gamehall = req.body.gamehall;
    const mtcode = req.body.mtcode;
    const roundid = req.body.roundid;

    let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                res.status(201).json({
                    data: {
                        balance: balanceUser,
                        currency: "THB",
                    },
                    status: {
                        code: "0",
                        message: "Success",
                        datetime: eventTime,
                    },
                });
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//localhost:5000/post/CQ9/transaction/game/takeall
http: exports.GameTakeAllCQ9 = async (req, res) => {
    const usernameGame = req.body.account;
    const eventTime = req.body.eventTime;
    const gamecode = req.body.gamecode;
    const gamehall = req.body.gamehall;
    const mtcode = req.body.mtcode;
    const roundid = req.body.roundid;

    let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const balanceUser = parseFloat(results[0].credit);
                res.status(201).json({
                    data: {
                        balance: balanceUser,
                        amount: 0,
                        currency: "THB",
                    },
                    status: {
                        code: "0",
                        message: "Success",
                        datetime: eventTime,
                    },
                });
            }
        });
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};
