const { response } = require("express");
const mysql = require('mysql2') //npm install mysql2
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const os = require('os');
require('dotenv').config()
const useragent = require('express-useragent')
const repostGame = require('./repostGame')

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
function truncateToSingleDecimalPlace(number) {
  return Math.floor(number * 10) / 10;
}
http://localhost:5000/post/checkBalance 
exports.checkBalance = async (req, res) => {
  const id = req.body.id;
  const timestampMillis = req.body.timestampMillis;
  const productId = req.body.productId;
  const currency = req.body.currency;
  const authHeader = req.body.sessionToken;
  const usernameGame = req.body.username;

  username = 'member001';

  if (!authHeader) {
    const error = new Error('Not authenticated!');
    error.statusCode = 500;
  }

  let spl = `SELECT credit FROM member WHERE username ='${usernameGame}' AND status_delete='N' 
  ORDER BY member_code ASC`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const timestamp = parseInt(timestampMillis);
        const balanceUser = parseFloat(results[0].credit);
        res.status(201).json({
          id: id,
          statusCode: 0,
          timestampMillis: timestamp,
          productId: productId,
          currency: currency,
          balance: balanceUser,
          username: usernameGame
        });
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/settleBets 
exports.settleBets = async (req, res) => {
  const id = req.body.id;
  const timestampMillis = req.body.timestampMillis;
  const productId = req.body.productId;
  const currency = req.body.currency;
  const usernameGame = req.body.username;
  const txnsGame = req.body.txns;
  username = 'member001';

  let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const timestamp = parseInt(timestampMillis);
        const balanceUser = parseFloat(results[0].credit);
        const betPlay = txnsGame[0].betAmount;
        const betPlayOut = txnsGame[0].payoutAmount;
        const balanceNow = balanceUser - betPlay + betPlayOut;
        const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betPlay}' WHERE phonenumber ='${usernameGame}'`;

        connection.query(sql_update, (error, resultsGame) => {
          if (error) { console.log(error) }
          else {
            res.status(201).json({
              id: id,
              statusCode: 0,
              timestampMillis: timestamp,
              productId: productId,
              currency: currency,
              balanceBefore: balanceUser,
              balanceAfter: balanceNow,
              username: usernameGame
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

//SlotXO-------------------------------------------------------------------------------------------------------------------------------------------------------------------
http://localhost:5000/post/authenticate-token 
exports.authenticate = async (req, res) => {
  const authHeader = req.body.token;
  const ip = req.body.ip;
  const timestamp = req.body.timestamp;

  let spl = `SELECT credit, username FROM member WHERE tokenplaygame ='${authHeader}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        res.status(201).json({
          Status: 0,
          Message: "Success",
          Username: results[0].username,
          Balance: 10000
        });
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/balance 
exports.balanceXO = async (req, res) => {
  const timestamp = req.body.timestamp;
  const usernameGame = req.body.username;
  username = 'member001';
  let spl = `SELECT credit FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        res.status(201).json({
          Status: 0,
          Message: "Success",
          Username: usernameGame,
          Balance: balanceUser
        });
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/bet 
exports.PlaceBetSlotXo = async (req, res) => {
  const id = req.body.id;
  const amount = req.body.amount;
  const timestamp = req.body.timestamp;
  const roundid = req.body.roundid;
  const usernameGame = req.body.username;
  const gamecode = req.body.gamecode;
  const userAgent = req.headers['user-agent'];

  let spl = `SELECT credit, turnover, gameplayturn, playgameuser, roundId, idplaygame, actiongamenow FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        const balanceNow = balanceUser - amount;
        if (balanceUser > amount) {
          if (results[0].idplaygame === id) {
            const sql_update = `UPDATE member set credit='${balanceUser}',bet_latest='${amount}', actiongamenow ='placeBetFail', unsettleplay = 'N', 
          winbonus ='N', roundId = '${roundid}', idplaygame  = '${id}' WHERE phonenumber ='${usernameGame}'`;
            connection.query(sql_update, (error, resultsGame) => {
              if (error) { console.log(error) }
              else {
                res.status(201).json({
                  Status: 0,
                  Message: "Success",
                  Username: usernameGame,
                  Balance: balanceUser,
                  action: 'idalready'
                });
              }
            });
          } else {
            if (results[0].actiongamenow === 'CancelNotSave') {
              const sql_update = `UPDATE member set credit='${balanceUser}',bet_latest='${amount}', actiongamenow ='placeBetNotSave', unsettleplay = 'N', 
              winbonus ='N', roundId = '${roundid}', idplaygame  = '${id}' WHERE phonenumber ='${usernameGame}'`;
              connection.query(sql_update, (error, resultsGame) => {
                if (error) { console.log(error) }
                else {
                  res.status(201).json({
                    Status: 0,
                    Message: "Success",
                    Username: usernameGame,
                    Balance: balanceUser,
                    action: 'idalready555',
                    actiongamenow: results[0].actiongamenow
                  });
                }
              });
            } else {
              const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${amount}', actiongamenow ='placeBet', unsettleplay = 'N', 
              winbonus ='N', roundId = '${roundid}', idplaygame  = '${id}' WHERE phonenumber ='${usernameGame}'`;
              connection.query(sql_update, (error, resultsGame) => {
                if (error) { console.log(error) }
                else {
                  res.status(201).json({
                    Status: 0,
                    Message: "Success",
                    Username: usernameGame,
                    Balance: truncateToSingleDecimalPlace(balanceNow),
                    action: 'idNOalready',
                    actiongamenow: results[0].actiongamenow
                  });
                }
              });
            }
          }
        } else {
          const sql_update = `UPDATE member set actiongamenow ='placeBetFail', unsettleplay = 'N', 
          winbonus ='N', roundId = '${roundid}', idplaygame  = '${id}' WHERE phonenumber ='${usernameGame}'`;
          connection.query(sql_update, (error, resultsGame) => {
            if (error) { console.log(error) }
            else {
              res.status(201).json({
                Error: "100",
                Description: "Insufficient fund"
              });
            }
          });
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/settle-bet 
exports.SettlePlaySlotXo = async (req, res) => {
  const amount = req.body.amount;
  const usernameGame = req.body.username;
  const gamecode = req.body.gamecode;
  const userAgent = req.headers['user-agent'];
  const timestamp = req.body.timestamp;
  const roundid = req.body.roundid;

  let spl = `SELECT credit, playgameuser, bet_latest, turnover, gameplayturn FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        let splroundId = `SELECT roundId FROM repostgame WHERE roundId  ='${roundid}'`;
        connection.query(splroundId, (error, resultsroundId) => {
          if (error) {
            console.log(error);
          } else {
            if (resultsroundId.length === 0) {
              const namegame = results[0].playgameuser;
              const balanceUser = parseFloat(results[0].credit);
              const betPlay = results[0].bet_latest;
              const balanceNow = balanceUser + amount;
              let postTurnover = results[0].turnover - betPlay;
              if (postTurnover < 0) { postTurnover = 0; }
              let balanceturnover = hasSimilarData(results[0].gameplayturn, "SLOTXO", results[0].turnover, amount)
              const post = {
                username: usernameGame, gameid: "SLOTXO", bet: betPlay, win: amount, balance_credit: balanceNow,
                userAgent: userAgent, platform: userAgent, trans_id: roundid, namegame: namegame, roundId: roundid, balancebefore: balanceUser
              }
              let repost = repostGame.uploadLogRepostGame(post)
              const sql_update = `UPDATE member set credit='${balanceNow}', turnover='${balanceturnover}' WHERE phonenumber ='${usernameGame}' `;
              connection.query(sql_update, (error, resultsGame) => {
                if (error) { console.log(error) }
                else {
                  res.status(201).json({
                    Status: 0,
                    Message: "Success",
                    Username: usernameGame,
                    Balance: balanceNow
                  });
                }
              });
            } else {
              const balanceUser = parseFloat(results[0].credit);
              res.status(201).json({
                Status: 0,
                Message: "Success",
                Username: usernameGame,
                Balance: balanceUser
              });
            }
          }
        })
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/cancel-bet
exports.CancelPlaySlotXo = async (req, res) => {
  const usernameGame = req.body.username;
  const id = req.body.id;
  let spl = `SELECT credit, bet_latest, idplaygame, actiongamenow FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        if (results[0].idplaygame === id) {
          const balanceUser = parseFloat(results[0].credit);
          const sql_update = `UPDATE member set credit='${balanceUser}', actiongamenow ='Cancel' WHERE phonenumber ='${usernameGame}'`;
          connection.query(sql_update, (error, resultsGame) => {
            if (error) { console.log(error) }
            else {
              res.status(201).json({
                Status: 0,
                Message: "Success",
                Username: usernameGame,
                Balance: balanceUser
              });
            }
          });
        } else {
          if (results[0].actiongamenow === 'placeBet') {
            const balanceUser = parseFloat(results[0].credit);
            const betPlay = parseFloat(results[0].bet_latest);
            let balanceNow = balanceUser + betPlay;
            const sql_update = `UPDATE member set credit='${balanceNow}', idplaygame = '${id}', actiongamenow ='CancelSave' WHERE phonenumber ='${usernameGame}'`;
            connection.query(sql_update, (error, resultsGame) => {
              if (error) { console.log(error) }
              else {
                res.status(201).json({
                  Status: 0,
                  Message: "Success",
                  Username: usernameGame,
                  Balance: balanceNow
                });
              }
            });
          } else {
            const balanceUser = parseFloat(results[0].credit);
            const sql_update = `UPDATE member set credit='${balanceUser}', actiongamenow ='CancelNotSave' WHERE phonenumber ='${usernameGame}'`;
            connection.query(sql_update, (error, resultsGame) => {
              if (error) { console.log(error) }
              else {
                res.status(201).json({
                  Status: 0,
                  Message: "Success",
                  Username: usernameGame,
                  Balance: balanceUser
                });
              }
            });
          }
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/bonus-win
exports.bonusPlaySlotXo = async (req, res) => {
  const amount = req.body.amount;
  const usernameGame = req.body.username;
  const roundid = req.body.roundid;
  let spl = `SELECT credit, winbonus, roundId FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        if (results[0].roundId === roundid) {
          if (results[0].winbonus === 'N') {
            const balanceUser = parseFloat(results[0].credit);
            const balanceNow = balanceUser + amount;
            const sql_update = `UPDATE member set credit='${balanceNow}', winbonus = 'Y', roundId = '${roundid}' 
            WHERE phonenumber ='${usernameGame}'`;
            connection.query(sql_update, (error, resultsGame) => {
              if (error) { console.log(error) }
              else {
                res.status(201).json({
                  Status: 0,
                  Message: "Success",
                  Username: usernameGame,
                  Balance: balanceNow
                });
              }
            });
          } else {
            const balanceUser = parseFloat(results[0].credit);
            res.status(201).json({
              Status: 0,
              Message: "Success",
              Username: usernameGame,
              Balance: balanceUser
            });
          }
        } else {
          const balanceUser = parseFloat(results[0].credit);
          const balanceNow = balanceUser + amount;
          const sql_update = `UPDATE member set credit='${balanceNow}', winbonus = 'Y', roundId = '${roundid}' 
          WHERE phonenumber ='${usernameGame}'`;
          connection.query(sql_update, (error, resultsGame) => {
            if (error) { console.log(error) }
            else {
              res.status(201).json({
                Status: 0,
                Message: "Success",
                Username: usernameGame,
                Balance: balanceNow
              });
            }
          });
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/jackpot-win
exports.JackpotPlaySlotXo = async (req, res) => {
  const amount = req.body.amount;
  const usernameGame = req.body.username;
  const roundid = req.body.roundid;
  let spl = `SELECT credit, winbonus, roundId FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        if (results[0].roundId === roundid) {
          if (results[0].winbonus === 'N') {
            const balanceUser = parseFloat(results[0].credit);
            const balanceNow = balanceUser + amount;
            const sql_update = `UPDATE member set credit='${balanceNow}' roundId = '${roundid}' 
            WHERE phonenumber ='${usernameGame}'`;
            connection.query(sql_update, (error, resultsGame) => {
              if (error) { console.log(error) }
              else {
                res.status(201).json({
                  Status: 0,
                  Message: "Success",
                  Username: usernameGame,
                  Balance: balanceNow
                });
              }
            });
          } else {
            const balanceUser = parseFloat(results[0].credit);
            res.status(201).json({
              Status: 0,
              Message: "Success",
              Username: usernameGame,
              Balance: balanceUser
            });
          }
        } else {
          const balanceUser = parseFloat(results[0].credit);
          const balanceNow = balanceUser + amount;
          const sql_update = `UPDATE member set credit='${balanceNow}', roundId = '${roundid}' 
          WHERE phonenumber ='${usernameGame}'`;
          connection.query(sql_update, (error, resultsGame) => {
            if (error) { console.log(error) }
            else {
              res.status(201).json({
                Status: 0,
                Message: "Success",
                Username: usernameGame,
                Balance: balanceNow
              });
            }
          });
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/transaction
exports.TransactionSlotXo = async (req, res) => {
  const amount = req.body.amount;
  const usernameGame = req.body.username;
  const userAgent = req.headers['user-agent'];
  const timestamp = req.body.timestamp;
  console.log(amount);
  let spl = `SELECT credit, playgameuser FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const namegame = results[0].playgameuser;
        const balanceUser = parseFloat(results[0].credit);
        const balanceNow = balanceUser;
        const post = {
          username: usernameGame, gameid: "SLOTXO", bet: amount, win: 0, balance_credit: balanceNow,
          userAgent: userAgent, platform: userAgent, trans_id: timestamp, namegame: namegame
        }
        let repost = repostGame.uploadLogRepostGameAsk(post)
        const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${amount}' WHERE phonenumber ='${usernameGame}'`;
        connection.query(sql_update, (error, resultsGame) => {
          if (error) { console.log(error) }
          else {
            res.status(201).json({
              Status: 0,
              Message: "Success",
              Username: usernameGame,
              Balance: balanceNow
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

http://localhost:5000/post/withdraw
exports.WithdrawSlotXo = async (req, res) => {
  const id = req.body.id;
  const amount = req.body.amount;
  const timestamp = req.body.timestamp;
  const roundid = req.body.roundid;
  const usernameGame = req.body.username;
  const gamecode = req.body.gamecode;
  const userAgent = req.headers['user-agent'];

  let spl = `SELECT credit, winbonus, idplaygame FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        if (amount < balanceUser) {
          if (results[0].idplaygame === id) {
            res.status(201).json({
              Status: 0,
              Message: "Success",
              Username: usernameGame,
              Balance: balanceUser
            });
          } else {
            const balanceNow = balanceUser - amount;
            const sql_update = `UPDATE member set credit='${balanceNow}', idplaygame = '${id}' 
            WHERE phonenumber ='${usernameGame}'`;
            connection.query(sql_update, (error, resultsGame) => {
              if (error) { console.log(error) }
              else {
                res.status(201).json({
                  Status: 0,
                  Message: "Success",
                  Username: usernameGame,
                  Balance: balanceNow
                });
              }
            });
          }
        } else {
          res.status(201).json({
            Error: "100",
            Description: "Insufficient fund"
          });
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/deposit
exports.DepositSlotXo = async (req, res) => {
  const id = req.body.id;
  const amount = req.body.amount;
  const timestamp = req.body.timestamp;
  const roundid = req.body.roundid;
  const usernameGame = req.body.username;
  const gamecode = req.body.gamecode;
  const userAgent = req.headers['user-agent'];

  let spl = `SELECT credit, winbonus, idplaygame FROM member WHERE phonenumber ='${usernameGame}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        if (amount < balanceUser) {
          if (results[0].idplaygame === id) {
            res.status(201).json({
              Status: 0,
              Message: "Success",
              Username: usernameGame,
              Balance: balanceUser
            });
          } else {
            const balanceNow = balanceUser + amount;
            const sql_update = `UPDATE member set credit='${balanceNow}', idplaygame = '${id}' 
            WHERE phonenumber ='${usernameGame}'`;
            connection.query(sql_update, (error, resultsGame) => {
              if (error) { console.log(error) }
              else {
                res.status(201).json({
                  Status: 0,
                  Message: "Success",
                  Username: usernameGame,
                  Balance: balanceNow
                });
              }
            });
          }
        } else {
          res.status(201).json({
            Error: "100",
            Description: "Insufficient fund"
          });
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/authenticate
exports.MobileauthenticateXoJo = async (req, res) => {
  const password = req.body.password;
  const ip = req.body.ip;
  const timestamp = req.body.timestamp;
  const userUsername = username
  let username = 'member001';
  const token = jwt.sign(
    {
      userUsername: userUsername,
      password: password,
      timestamp: timestamp,
      ip: ip
    },
    'secretfortoken',
    { expiresIn: '48h' }
  );
  let spl = `SELECT credit FROM member WHERE phonenumber ='${userUsername}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        res.status(201).json({
          Status: 0,
          Token: token,
          Balance: balanceUser,
          Message: "Success",
        });
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/seamless/getAppUsername
exports.GetMobileauthenticateXoJo = async (req, res) => {
  const productId = req.body.productId;
  const password = req.body.password;
  const userUsername = req.body.username
  let username = 'member001';
  let spl = `SELECT credit FROM member WHERE phonenumber ='${userUsername}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        res.status(201).json({
          reqId: "f47e5065-412c-40d1-9e4c-f6c248919509",
          code: 0,
          message: "Success",
          data: {
            applicationUsername: "TFY1.001CJE2WC"
          }
        });
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

//Askmebet-------------------------------------------------------------------------------------------------------------------------------------------------------------

http://localhost:5000/post/api/wallet/balance
exports.GetBalanceAsk = async (req, res) => {
  const agent = req.body.agent;
  const account = req.body.account;
  const authHeader = req.body.token;

  let spl = `SELECT credit, tokenplaygame FROM member WHERE phonenumber ='${account}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        if (results[0].tokenplaygame === authHeader) {
          const balanceUser = parseFloat(results[0].credit);
          res.status(201).json({
            "status": 1,
            "balance": balanceUser
          });
        } else {
          const balanceUser = parseFloat(results[0].credit);
          res.status(201).json({
            "status": 3,
            "balance": 0
          });
        }

      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/api/wallet/bet
exports.PlaceBetAsk = async (req, res) => {
  const trans_id = req.body.trans_id;
  const agent = req.body.agent;
  const account = req.body.account;
  const game_id = req.body.game_id;
  const amount = req.body.amount;
  const authHeader = req.body.token;

  let spl = `SELECT credit, turnover, gameplayturn, playgameuser, roundId FROM member WHERE phonenumber ='${account}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        if (results[0].roundId === trans_id) {
          res.status(201).json({
            "status": 4,
            "balance": balanceUser
          });
        } else {
          const balanceNow = balanceUser - amount;
          const namegame = results[0].playgameuser;
          const userAgent = req.headers['user-agent'];
          const isMobile = /Mobile|Android/.test(userAgent);
          let platform = 'mobile';
          if (isMobile) {
            platform = 'mobile';
          } else {
            platform = 'computer pc';
          }

          const post = {
            username: account, gameid: "ASKMEBET", bet: amount, win: amount, balance_credit: balanceNow,
            userAgent: userAgent, platform: platform, trans_id: trans_id, namegame: namegame
          }
          let repost = repostGame.uploadLogRepostGameAsk(post)

          let balanceturnover = hasSimilarData(results[0].gameplayturn, "ASKMEBET", results[0].turnover, amount)

          const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${amount}', turnover='${balanceturnover}', roundId = '${trans_id}'
          WHERE phonenumber ='${account}'`;
          connection.query(sql_update, (error, resultsGame) => {
            if (error) { console.log(error) }
            else {
              res.status(201).json({
                status: 1,
                trans_id: trans_id,
                balance: balanceNow
              });
            }
          });
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/api/wallet/payout
exports.SettleBetAsk = async (req, res) => {
  const trans_id = req.body.trans_id;
  const agent = req.body.agent;
  const account = req.body.account;
  const game_id = req.body.game_id;
  const amount = req.body.amount;
  const authHeader = req.body.token;
  const userAgent = req.headers['user-agent'];
  const userAgentt = req.useragent;

  let spl = `SELECT credit, turnover, gameplayturn, playgameuser  FROM member WHERE phonenumber ='${account}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const namegame = results[0].playgameuser;
        const balanceUser = parseFloat(results[0].credit);
        const balanceNow = balanceUser + amount;
        const post = {
          username: account, gameid: "ASKMEBET", bet: 0, win: amount, balance_credit: balanceNow,
          userAgent: userAgent, platform: userAgentt, trans_id: trans_id, namegame: namegame
        }
        let repost = repostGame.uploadLogRepostGameAsk(post)

        const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${0}' WHERE phonenumber ='${account}'`;
        connection.query(sql_update, (error, resultsGame) => {
          if (error) { console.log(error) }
          else {
            res.status(201).json({
              status: 1,
              trans_id: trans_id,
              balance: truncateToSingleDecimalPlace(balanceNow)
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

http://localhost:5000/post/api/wallet/cancel
exports.CancelBetAsk = async (req, res) => {
  const trans_id = req.body.trans_id;
  const agent = req.body.agent;
  const account = req.body.account;
  const game_id = req.body.game_id;
  const amount = req.body.amount;
  username = 'member001';

  let spl = `SELECT credit FROM member WHERE phonenumber ='${account}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        let balanceNow = balanceUser + amount
        res.status(201).json({
          status: 1,
          trans_id: trans_id,
          balance: truncateToSingleDecimalPlace(balanceNow)
        });
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

//JILI Seamless Integration APIs

http://localhost:5000/post/Jili/auth
exports.PlayerAuthenticationJili = async (req, res) => {
  const reqId = req.body.reqId;
  const authHeader = req.body.token;
  //const username = '0990825941';
  console.log(req.body);
  let spl = `SELECT credit, username FROM member WHERE tokenplaygame ='${authHeader}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        const balanceUser = parseFloat(results[0].credit);
        res.status(201).json({
          errorCode: 0,
          message: "success",
          username: results[0].username,
          currency: "THB",
          balance: balanceUser,
          token: authHeader
        });
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/Jili/bet
exports.PlayerBetJili = async (req, res) => {
  const reqId = req.body.reqId;
  const authHeader = req.body.token;
  const round = req.body.round;
  const isFreeRound = req.body.isFreeRound;
  const betAmount = req.body.betAmount;
  const winloseAmount = req.body.winloseAmount;
  const userAgent = req.headers['user-agent'];
  const game = req.body.game;
  let spl = `SELECT credit, turnover, username, gameplayturn, playgameuser, roundId FROM member WHERE tokenplaygame ='${authHeader}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        if (results[0].roundId === round) {
          res.status(201).json({
            errorCode: 1,
            message: "Already accepted",
          });
        } else {
          const balanceUser = parseFloat(results[0].credit);
          if (balanceUser < betAmount) {
            res.status(201).json({
              errorCode: 2,
              message: "Not enough balance",
            });
          } else {
            const balanceNow = balanceUser - betAmount;
            const balanceNowwit = balanceNow + winloseAmount
            const namegame = results[0].playgameuser;
            const post = {
              username: results[0].username, gameid: 'JILI', bet: betAmount, win: winloseAmount, balance_credit: balanceNowwit,
              userAgent: userAgent, platform: userAgent, namegame: namegame, roundId: round, balancebefore: balanceUser,
              trans_id: reqId
            }
            let repost = repostGame.uploadLogRepostGame(post)

            let balanceturnover = hasSimilarData(results[0].gameplayturn, "JILI", results[0].turnover, betAmount)

            const sql_update = `UPDATE member set credit='${balanceNowwit}',bet_latest='${betAmount}', turnover='${balanceturnover}',
            roundId = '${round}' WHERE phonenumber ='${results[0].username}'`;
            connection.query(sql_update, (error, resultsGame) => {
              if (error) { console.log(error) }
              else {
                res.status(201).json({
                  errorCode: 0,
                  message: "success",
                  username: results[0].username,
                  currency: "THB",
                  balance: balanceNowwit,
                  txId: round,
                  token: authHeader
                });
              }
            });
          }
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};

http://localhost:5000/post/Jili/cancelBet
exports.CancelBetJili = async (req, res) => {
  const reqId = req.body.reqId;
  const authHeader = req.body.token;
  const round = req.body.round;
  const betAmount = req.body.betAmount;
  const winloseAmount = req.body.winloseAmount;
  let spl = `SELECT credit, username, roundId, idplaygame FROM member WHERE tokenplaygame ='${authHeader}' AND status_delete='N'`;
  try {
    connection.query(spl, (error, results) => {
      if (error) { console.log(error) }
      else {
        if (results[0].roundId !== round) {
          res.status(201).json({
            errorCode: 2,
            message: "Not enough balance",
          });
        } else {
          if (results[0].idplaygame !== reqId) {
            const balanceUser = parseFloat(results[0].credit);
            if (winloseAmount !== 0) {
              const balanceNow = balanceUser - betAmount;
              const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betAmount}', idplaygame  = '${reqId}'
              WHERE phonenumber ='${results[0].username}'`;
              connection.query(sql_update, (error, resultsGame) => {
                if (error) { console.log(error) }
                else {
                  res.status(201).json({
                    errorCode: 0,
                    message: "Success",
                    username: results[0].username,
                    currency: "THB",
                    balance: balanceNow,
                    txId: round,
                  });
                }
              });
            } else {
              const balanceNow = balanceUser + betAmount;
              const sql_update = `UPDATE member set credit='${balanceNow}',bet_latest='${betAmount}', idplaygame  = '${reqId}'
              WHERE phonenumber ='${results[0].username}'`;
              connection.query(sql_update, (error, resultsGame) => {
                if (error) { console.log(error) }
                else {
                  res.status(201).json({
                    errorCode: 0,
                    message: "Success",
                    username: results[0].username,
                    currency: "THB",
                    balance: balanceNow,
                    txId: round,
                  });
                }
              });
            }
          } else {
            res.status(201).json({
              errorCode: 1,
              message: "Already accepted",
            });
          }
        }
      }
    })
  } catch (err) {
    err.statusCode = 500;
    res.json({ status: "Not Data Request Body." });
  }
};