const { response } = require("express");
const mysql = require('mysql2') //npm install mysql2
const jwt = require('jsonwebtoken');
const os = require('os');
const repostGame = require('./repostGame')
require('dotenv').config()

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD
});

function hasSimilarData(gameplayturn, input, turnover, betPlay) {
    if (gameplayturn !== "PlayAllGame") {
        const dataString = gameplayturn;
        const dataArray = dataString.split(',');
        let dataArrayGame = dataArray.some(item => input.includes(item));
        if (dataArrayGame) {
            let postTurnover = turnover - betPlay;
            if (postTurnover < 0) {
                postTurnover = 0;
                return postTurnover
            } else {
                return postTurnover
            }
        } else {
            return turnover;
        }
    } else {
        let postTurnover = turnover - betPlay;
        if (postTurnover < 0) {
            postTurnover = 0;
            return postTurnover
        } else {
            return postTurnover
        }
    }
}

//Live22-------------------------------------------------------------------------------------------------------------------------------------------------------------------

http://localhost:5000/post/Live/GetBalance  
exports.GetBalanceLive = async (req, res) => {
    const RequestDateTime = req.body.RequestDateTime;
    const currency = req.body.Currency;
    const usernameGame = req.body.PlayerId;

    username = 'member001';
    let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N' `;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                res.status(201).json({
                    Status: 200,
                    Description: "OK",
                    ResponseDateTime: RequestDateTime,
                    Balance: balanceUser,
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

http://localhost:5000/post/Live/Bet 
exports.BetLive = async (req, res) => {
    const RequestDateTime = req.body.RequestDateTime;
    const TranDateTime = req.body.TranDateTime;
    const BetId = req.body.BetId;
    const GameId = req.body.GameId;
    const GameType = req.body.GameType;
    const BetAmount = req.body.BetAmount;
    const JackpotContribution = req.body.JackpotContribution;
    const Currency = req.body.Currency;
    const ExchangeRate = req.body.ExchangeRate;
    const usernameGame = req.body.PlayerId;
    const userAgent = req.headers['user-agent'];
    let spl = `SELECT credit, turnover, gameplayturn, playgameuser, roundId FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                if (balanceUser > BetAmount) {
                    let stringNumber = BetId.toString();
                    if (stringNumber !== results[0].roundId) {
                        const balanceNow = balanceUser - BetAmount;
                        const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${BetAmount}', roundId ='${BetId}', actiongamenow ='1'
                        WHERE phonenumber ='${usernameGame}'`;
                        connection.query(sql_update, (error, resultsGame) => {
                            if (error) { console.log(error) }
                            else {
                                res.status(201).json({
                                    Status: 200,
                                    Description: "Duplicate Transaction",
                                    ResponseDateTime: RequestDateTime,
                                    OldBalance: balanceUser,
                                    NewBalance: balanceNow,
                                    action: BetId,
                                });
                            }
                        });
                    } else {
                        res.status(201).json({
                            Status: 900409,
                            Description: "Duplicate Transaction",
                            ResponseDateTime: RequestDateTime,
                            OldBalance: balanceUser,
                            NewBalance: balanceUser,
                            action: BetId,
                        });
                    }
                } else {
                    res.status(201).json({
                        Status: 900605,
                        Description: "OK",
                        ResponseDateTime: RequestDateTime,
                        OldBalance: balanceUser,
                        NewBalance: balanceUser,
                    });
                }
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

http://localhost:5000/post/Live/GameResult
exports.GameResultLive = async (req, res) => {
    const RequestDateTime = req.body.RequestDateTime;
    const Payout = req.body.Payout;
    const ResultId = req.body.ResultId;
    const BetId = req.body.BetId;
    const WinLose = req.body.WinLose;
    const ExchangeRate = req.body.ExchangeRate;
    const usernameGame = req.body.PlayerId;
    const userAgent = req.headers['user-agent'];
    const userAgentt = req.useragent;
    const ResultType = req.body.ResultType;
    let spl = `SELECT credit, playgameuser, roundId, bet_latest, turnover, gameplayturn, actiongamenow FROM member 
    WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const namegame = results[0].playgameuser;
                const balanceUser = parseFloat(results[0].credit);
                const balanceNow = balanceUser + Payout;
                if (ResultType === 0) {
                    if (results[0].actiongamenow === '1') {
                        let splroundId = `SELECT roundId FROM repostgame WHERE roundId  ='${ResultId}'`;
                        connection.query(splroundId, (error, resultsroundId) => {
                            if (error) {
                                console.log(error);
                            } else {
                                if (resultsroundId.length === 0) {
                                    const post = {
                                        username: usernameGame, gameid: "LIVE22", bet: results[0].bet_latest, win: Payout, balance_credit: balanceNow,
                                        userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: BetId,
                                        roundId: ResultId, balancebefore: balanceUser
                                    };
                                    let repost = repostGame.uploadLogRepostGame(post);
                                    let balanceturnover = hasSimilarData(results[0].gameplayturn, "LIVE22", results[0].turnover, results[0].bet_latest)
                                    const sql_update = `UPDATE member set credit='${balanceNow}', actiongamenow ='2' WHERE phonenumber ='${usernameGame}'`;
                                    connection.query(sql_update, (error, resultsGame) => {
                                        if (error) { console.log(error) }
                                        else {
                                            res.status(201).json({
                                                Status: 200,
                                                Description: "OK",
                                                ResponseDateTime: RequestDateTime,
                                                OldBalance: balanceUser,
                                                NewBalance: balanceNow,
                                            });
                                        }
                                    });
                                } else {
                                    res.status(201).json({
                                        Status: 900409,
                                        Description: "Duplicate Transaction",
                                        ResponseDateTime: RequestDateTime,
                                        OldBalance: balanceUser,
                                        NewBalance: balanceUser,
                                        action: BetId,
                                    });
                                }
                            }
                        })
                    } else {
                        let splroundId = `SELECT roundId FROM repostgame WHERE roundId  ='${ResultId}'`;
                        connection.query(splroundId, (error, resultsroundId) => {
                            if (error) {
                                console.log(error);
                            } else {
                                if (resultsroundId.length > 0) {
                                    res.status(201).json({
                                        Status: 900409,
                                        Description: "Duplicate Transaction",
                                        ResponseDateTime: RequestDateTime,
                                        OldBalance: balanceUser,
                                        NewBalance: balanceUser,
                                        action: BetId,
                                    });
                                } else {
                                    res.status(201).json({
                                        Status: 900415,
                                        Description: "Duplicate Transaction",
                                        ResponseDateTime: RequestDateTime,
                                        OldBalance: balanceUser,
                                        NewBalance: balanceUser,
                                        action: BetId,
                                    });
                                }
                            }
                        })
                    }
                } else {
                    let splroundId = `SELECT roundId FROM repostgame WHERE roundId  ='${ResultId}'`;
                    connection.query(splroundId, (error, resultsroundId) => {
                        if (error) {
                            console.log(error);
                        } else {
                            if (resultsroundId.length === 0) {
                                const post = {
                                    username: usernameGame, gameid: "LIVE22", bet: results[0].bet_latest, win: Payout, balance_credit: balanceNow,
                                    userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: BetId,
                                    roundId: ResultId, balancebefore: balanceUser
                                };
                                let repost = repostGame.uploadLogRepostGame(post);
                                let balanceturnover = hasSimilarData(results[0].gameplayturn, "LIVE22", results[0].turnover, results[0].bet_latest)
                                const sql_update = `UPDATE member set credit='${balanceNow}', actiongamenow ='2' WHERE phonenumber ='${usernameGame}'`;
                                connection.query(sql_update, (error, resultsGame) => {
                                    if (error) { console.log(error) }
                                    else {
                                        res.status(201).json({
                                            Status: 200,
                                            Description: "OK",
                                            ResponseDateTime: RequestDateTime,
                                            OldBalance: balanceUser,
                                            NewBalance: balanceNow,
                                        });
                                    }
                                });
                            } else {
                                res.status(201).json({
                                    Status: 900409,
                                    Description: "Duplicate Transaction",
                                    ResponseDateTime: RequestDateTime,
                                    OldBalance: balanceUser,
                                    NewBalance: balanceUser,
                                    action: BetId,
                                });
                            }
                        }
                    })
                }
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

http://localhost:5000/post/Live/Rollback
exports.RollbackLive = async (req, res) => {
    const RequestDateTime = req.body.RequestDateTime;
    const BetAmount = req.body.BetAmount;
    const usernameGame = req.body.PlayerId;
    const BetId = req.body.BetId;
    let spl = `SELECT credit, bet_latest, actiongamenow FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);

                if (results[0].bet_latest > 0) {
                    if (results[0].actiongamenow === '1') {
                        const balanceNow = balanceUser + BetAmount;
                        const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${0.00}', actiongamenow ='C' 
                            WHERE phonenumber ='${usernameGame}'`;
                        connection.query(sql_update, (error, resultsGame) => {
                            if (error) { console.log(error) }
                            else {
                                res.status(201).json({
                                    Status: 200,
                                    Description: "OK",
                                    ResponseDateTime: RequestDateTime,
                                    OldBalance: balanceUser,
                                    NewBalance: balanceNow,
                                });
                            }
                        });
                    } else {
                        res.status(201).json({
                            Status: 900415,
                            Description: "Duplicate Transaction",
                            ResponseDateTime: RequestDateTime,
                            OldBalance: balanceUser,
                            NewBalance: balanceUser,
                            action: BetId,
                        });
                    }
                } else {
                    res.status(201).json({
                        Status: 900409,
                        Description: "Duplicate Transaction",
                        ResponseDateTime: RequestDateTime,
                        OldBalance: balanceUser,
                        NewBalance: balanceUser,
                        action: BetId,
                    });
                }
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//Dream Gaming-------------------------------------------------------------------------------------------------------------------------------------------------------------------
http://localhost:5000/post/Dream/user/getBalance 
exports.MemberBalanceDream = async (req, res) => {
    const authHeader = req.body.token;
    const member = req.body.member;
    username = '0990825941';
    let spl = `SELECT credit FROM member WHERE phonenumber ='${username}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                console.log(balanceUser);
                res.status(201).json({
                    codeId: 0,
                    token: authHeader,
                    member: {
                        username: member.username,
                        balance: balanceUser
                    }
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

http://localhost:5000/post/Dream/account/transfer
exports.MemberTransferDream = async (req, res) => {
    const authHeader = req.body.token;
    const ticketId = req.body.ticketId;
    const data = req.body.data;
    const member = req.body.member;
    username = '0990825941';
    let spl = `SELECT credit FROM member WHERE phonenumber ='${username}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                const balanceNow = balanceUser + member.amount;
                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${0}' WHERE phonenumber ='${username}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) { console.log(error) }
                    else {
                        res.status(201).json({
                            codeId: 0,
                            token: authHeader,
                            data: data,
                            member: {
                                username: member.username,
                                amount: member.amount,
                                balance: balanceNow
                            }
                        });
                    }
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

http://localhost:5000/post/Dream/account/inform
exports.RollbackDream = async (req, res) => {
    const authHeader = req.body.token;
    const ticketId = req.body.ticketId;
    const data = req.body.data;
    const member = req.body.member;
    username = '0990825941';
    let spl = `SELECT credit FROM member WHERE username ='${username}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                const balanceNow = balanceUser - member.amount;
                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${0}' WHERE username ='${username}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) { console.log(error) }
                    else {
                        res.status(201).json({
                            codeId: 0,
                            token: authHeader,
                            data: data,
                            member: {
                                username: member.username,
                                balance: balanceNow
                            }
                        });
                    }
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.json({ status: "Not Data Request Body." });
    }
};

//Manna Play-------------------------------------------------------------------------------------------------------------------------------------------------------------------
http://localhost:5000/post/Manna/fetchBalance
exports.FetchBalanceManna = async (req, res) => {
    const account = req.body.account;
    const sessionId = req.body.sessionId;
    username = 'member001';
    let spl = `SELECT credit FROM member WHERE username ='${account}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                res.status(201).json({
                    balance: balanceUser
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            errorCode: 10100,
            message: "Server is not ready!"
        });
    }
};

http://localhost:5000/post/Manna/withdraw
exports.WithdrawManna = async (req, res) => {
    const account = req.body.account;
    const transaction_id = req.body.transaction_id;
    const sessionId = req.body.sessionId;
    const round_id = req.body.round_id;
    const amount = req.body.amount;
    const game_id = req.body.game_id;
    username = 'member001';
    const userAgent = req.headers['user-agent'];

    let spl = `SELECT credit, turnover, gameplayturn, playgameuser, roundId, actiongamenow 
    FROM member WHERE username ='${account}' AND status_delete='N' ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                if (balanceUser > amount) {
                    if (results[0].roundId !== round_id) {
                        if (amount > 0) {
                            const balanceNow = balanceUser - amount;
                            const namegame = results[0].playgameuser;
                            const sql_update = `UPDATE member set credit='${balanceNow}', bet_latest='${amount}', roundId ='${round_id}',
                            actiongamenow = '1' WHERE username ='${account}'`;
                            connection.query(sql_update, (error, resultsGame) => {
                                if (error) { console.log(error) }
                                else {
                                    res.status(201).json({
                                        transaction_id: transaction_id,
                                        balance: balanceNow,
                                    });
                                }
                            });
                        } else {
                            res.status(201).json({
                                errorCode: 10201,
                                message: "Warning value must not be less 0.",
                            });
                        }
                    } else {
                        res.status(201).json({
                            errorCode: 10208,
                            message: "Transaction id exists!",
                        });
                    }
                } else {
                    res.status(201).json({
                        errorCode: 10203,
                        message: "Balance value error. Insufficient balance",
                    });
                }
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            errorCode: 10100,
            message: "Server is not ready!"
        });
    }
};

http://localhost:5000/post/Manna/deposit
exports.DepositManna = async (req, res) => {
    const account = req.body.account;
    const transaction_id = req.body.transaction_id;
    const sessionId = req.body.sessionId;
    const round_id = req.body.round_id;
    const amount = req.body.amount;
    const jp_win = req.body.jp_win;
    const game_id = req.body.game_id;
    const userAgent = req.headers['user-agent'];
    const userAgentt = req.useragent;

    let spl = `SELECT credit, playgameuser, bet_latest, gameplayturn, turnover, actiongamenow, roundId 
    FROM member WHERE username ='${account}' AND status_delete='N' ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                let splroundId = `SELECT roundId FROM repostgame WHERE roundId  ='${round_id}'`;
                connection.query(splroundId, (error, resultsroundId) => {
                    if (error) {
                        console.log(error);
                    } else {
                        if (resultsroundId.length === 0) {
                            if (results[0].roundId === round_id) {
                                if (amount >= 0) {
                                    const balanceUser = parseFloat(results[0].credit);
                                    const balanceNow = balanceUser + amount + jp_win;
                                    const namegame = results[0].playgameuser;

                                    let balanceturnover = hasSimilarData(results[0].gameplayturn, "MANNA", results[0].turnover, amount)
                                    const post = {
                                        username: account, gameid: "MANNA", bet: results[0].bet_latest, win: amount, balance_credit: balanceNow,
                                        userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: sessionId,
                                        roundId: round_id, balancebefore: balanceUser
                                    };
                                    let repost = repostGame.uploadLogRepostGame(post);

                                    const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}', actiongamenow = '2' 
                                    WHERE username ='${account}'`;
                                    connection.query(sql_update, (error, resultsGame) => {
                                        if (error) { console.log(error) }
                                        else {
                                            res.status(201).json({
                                                transaction_id: transaction_id,
                                                balance: balanceNow,
                                            });
                                        }
                                    });
                                } else {
                                    res.status(201).json({
                                        errorCode: 10201,
                                        message: "Warning value must not be less 0.",
                                    });
                                }
                            } else {
                                res.status(201).json({
                                    errorCode: 10212,
                                    message: "Round was not found!",
                                });
                            }
                        } else {
                            res.status(201).json({
                                errorCode: 10208,
                                message: "Transaction id exists!",
                            });
                        }
                    }
                })

            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            errorCode: 10100,
            message: "Server is not ready!"
        });
    }
};

http://localhost:5000/post/Manna/rollback
exports.RollbackManna = async (req, res) => {
    const account = req.body.account;
    const transaction_id = req.body.transaction_id;
    const sessionId = req.body.sessionId;
    const currency = req.body.currency;
    let spl = `SELECT credit, bet_latest, actiongamenow FROM member WHERE username ='${account}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                if (results[0].bet_latest !== 0.00) {
                    if (results[0].actiongamenow === '1') {
                        const balanceUser = parseFloat(results[0].credit);
                        const balanceNow = balanceUser + results[0].bet_latest;

                        const sql_update = `UPDATE member set credit='${balanceNow}', bet_latest='${0.00}', actiongamenow = '3' 
                        WHERE username ='${account}'`;
                        connection.query(sql_update, (error, resultsGame) => {
                            if (error) { console.log(error) }
                            else {
                                res.status(201).json({
                                    transaction_id: transaction_id,
                                    balance: balanceNow,
                                });
                            }
                        });
                    } else {
                        res.status(201).json({
                            errorCode: 10210,
                            message: "Target transaction id not found!",
                        });
                    }
                } else {
                    res.status(201).json({
                        errorCode: 10208,
                        message: "Transaction id exists!",
                    });
                }
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            errorCode: 10100,
            message: "Server is not ready!"
        });
    }
};

http://localhost:5000/post/Manna/jp_deposit
exports.JP_DepositManna = async (req, res) => {
    const account = req.body.account;
    const transaction_id = req.body.transaction_id;
    const jp_win = req.body.jp_win;
    const round_id = req.body.round_id;
    const userAgent = req.headers['user-agent'];
    const userAgentt = req.useragent;
    const sessionId = req.body.sessionId;

    let spl = `SELECT credit, roundId, playgameuser FROM member WHERE username ='${account}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                if (results[0].roundId !== round_id) {
                    const balanceUser = parseFloat(results[0].credit);
                    const balanceNow = balanceUser + jp_win;
                    const namegame = results[0].playgameuser;
                    const post = {
                        username: account, gameid: "MANNA", bet: 0, win: jp_win, balance_credit: balanceNow,
                        userAgent: userAgent, platform: userAgentt, namegame: namegame, trans_id: sessionId,
                        roundId: round_id, balancebefore: balanceUser
                    };
                    let repost = repostGame.uploadLogRepostGame(post);

                    const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest ='${0.01}', roundId ='${round_id}', actiongamenow = '4' 
                    WHERE username ='${account}'`;
                    connection.query(sql_update, (error, resultsGame) => {
                        if (error) { console.log(error) }
                        else {
                            res.status(201).json({
                                transaction_id: transaction_id,
                                balance: balanceNow,
                            });
                        }
                    });
                } else {
                    res.status(201).json({
                        errorCode: 10208,
                        message: "Transaction id exists!",
                    });
                }
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            errorCode: 10100,
            message: "Server is not ready!"
        });
    }
};

//Simple Play -------------------------------------------------------------------------------------------------------------------------------------------------------------------

http://localhost:5000/post/SimplePlay/GetUserBalance
exports.GetUserBalanceSimplePlay = async (req, res) => {
    const usernames = req.body.username;
    const currency = req.body.currency;
    username = 'member001';
    let spl = `SELECT credit FROM member WHERE username ='${usernames}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                res.status(201).json({
                    username: usernames,
                    currency: currency,
                    amount: balanceUser,
                    error: 0
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            message: "Server is not ready!"
        });
    }
};

http://localhost:5000/post/SimplePlay/PlaceBet
exports.PlaceBetSimplePlay = async (req, res) => {
    const usernames = req.body.username;
    const transaction_id = req.body.txnid;
    const amount = req.body.amount;
    const currency = req.body.currency;
    const userAgent = req.headers['user-agent'];
    const game_id = req.body.gamecode;
    let spl = `SELECT credit, turnover, gameplayturn, playgameuser FROM member WHERE username ='${usernames}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                const balanceamount = parseFloat(amount);
                const balanceNow = balanceUser - balanceamount;
                const namegame = results[0].playgameuser;
                let balanceturnover = hasSimilarData(results[0].gameplayturn, "SIMPLEPLAY", results[0].turnover, balanceamount)

                const post = {
                    username: usernames, gameid: "SIMPLEPLAY", bet: balanceamount, win: 0, balance_credit: balanceNow,
                    userAgent: userAgent, platform: userAgent, trans_id: transaction_id, namegame: namegame
                }
                let repost = repostGame.uploadLogRepostGameAsk(post)

                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${balanceamount}', turnover='${balanceturnover}'
                WHERE username ='${usernames}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) { console.log(error) }
                    else {
                        res.status(201).json({
                            username: usernames,
                            currency: currency,
                            amount: balanceNow,
                            error: 0
                        });
                    }
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            message: "Server is not ready!"
        });
    }
};

http://localhost:5000/post/SimplePlay/PlayerWin
exports.PlayerWinSimplePlay = async (req, res) => {
    const usernames = req.body.username;
    const transaction_id = req.body.txnid;
    const amount = req.body.amount;
    const currency = req.body.currency;
    const userAgent = req.headers['user-agent'];
    const game_id = req.body.gamecode;

    let spl = `SELECT credit, playgameuser FROM member WHERE username ='${usernames}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                const balanceamount = parseFloat(amount);
                const balanceNow = balanceUser + balanceamount;
                const namegame = results[0].playgameuser;
                const post = {
                    username: usernames, gameid: "SIMPLEPLAY", bet: 0, win: balanceamount, balance_credit: balanceNow,
                    userAgent: userAgent, platform: userAgent, trans_id: transaction_id, namegame: namegame
                }
                let repost = repostGame.uploadLogRepostGameAsk(post)
                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${0}' WHERE username ='${usernames}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) { console.log(error) }
                    else {
                        res.status(201).json({
                            username: usernames,
                            currency: currency,
                            amount: balanceNow,
                            error: 0
                        });
                    }
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            message: "Server is not ready!"
        });
    }
};

http://localhost:5000/post/SimplePlay/PlayerLost
exports.PlayerLostSimplePlay = async (req, res) => {
    const usernames = req.body.username;
    const currency = req.body.currency;
    username = 'member001';
    let spl = `SELECT credit FROM member WHERE username ='${usernames}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                res.status(201).json({
                    username: usernames,
                    currency: currency,
                    amount: balanceUser,
                    error: 0
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            message: "Server is not ready!"
        });
    }
};

http://localhost:5000/post/SimplePlay/PlaceBetCancel
exports.PlaceBetCancelSimplePlay = async (req, res) => {
    const usernames = req.body.username;
    const txn_reverse_id = req.body.txn_reverse_id;
    const currency = req.body.currency;
    const amount = req.body.amount;
    username = 'member001';

    let spl = `SELECT credit FROM member WHERE username ='${usernames}' AND status_delete='N' 
  ORDER BY member_code ASC`;
    try {
        connection.query(spl, (error, results) => {
            if (error) { console.log(error) }
            else {
                const balanceUser = parseFloat(results[0].credit);
                const balanceamount = parseFloat(amount);
                const balanceNow = balanceUser + balanceamount;
                const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${0}' WHERE username ='${usernames}'`;
                connection.query(sql_update, (error, resultsGame) => {
                    if (error) { console.log(error) }
                    else {
                        res.status(201).json({
                            username: usernames,
                            currency: currency,
                            amount: balanceNow,
                            error: 0
                        });
                    }
                });
            }
        })
    } catch (err) {
        err.statusCode = 500;
        res.status(201).json({
            message: "Server is not ready!"
        });
    }
};
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------
