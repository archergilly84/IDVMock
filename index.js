const express = require("express");
const { Pool } = require("pg");

//Postgres setup
const pool = new Pool(
    {
        connectionString : "postgres://fdhjglpkvtwsvo:7ed4533c9afa1d3c11adf1ede368d53bca5597982f856b2f6c6c2ba00a98ec3b@ec2-54-77-182-219.eu-west-1.compute.amazonaws.com:5432/d4l78537dgpkfu",
        ssl: {
            rejectUnauthorized: false
        }
    }
)

const app = express();
let users = {};
let data = {};

//Required to listen to specific port for Heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

//To make the application deal with JSON
app.use(express.json());

const challenges = ["Enter CLI telephone number", "Date of Birth", "telephone number", "postcode", "nino",
"CIS_Home_Telephone_Number", "CIS_Mobile_Telephone_Number", "cis_benefit", "CIS_Childs_DOB", "CIS_Partners_NINO",
"ESA_Last_Payment_Amount", "ESA_Last_Payment_Date","ESA_Pay_Day", "ESA_Bank_Account", "ESA_Sort_Code",
"pip_lastpayment_amount", "pip_lastpayment_date","pip_pay_day", "pip_bank_details", "pip_sort_code"];
const cis_challenges = ["CIS_Home_Telephone_Number", "CIS_Mobile_Telephone_Number", "CIS_Benefits", "CIS_Childs_DOB", "CIS_Partners_NINO"];
const esa_challenges = ["ESA_Last_Payment_Amount", "ESA_Last_Payment_Date","ESA_Pay_Day", "ESA_Bank_Account", "ESA_Sort_Code"];
const pip_challenges = ["pip_lastpayment_amount", "pip_lastpayment_date","pip_pay_day", "pip_bank_details", "pip_sort_code","pip_component"];


async function selectAllFromUsersQuery(){
    return await pool.query(`SELECT * FROM Users;`)
    .then( 
     resolve => {
         result = resolve.rows
         
         if(result.length === 1){
             users[result[0].id] = result[0];
         } else {
             for(let i = 0; i < result.length; i++){
                 users[result[i].id] = result[i];
             }
         }
         return users;
     })
     .catch(err => console.error(err));
 }

async function selectAllFromMatchingQuery(){
    return await pool.query(`SELECT * FROM Matching;`)
    .then( 
     resolve => {
         result = resolve.rows
        
         return result[0];
     })
     .catch(err => console.error(err));
 }

 async function getNINO(guid){
    return await pool.query(`SELECT nino FROM Guid WHERE guid = ${guid};`)
    .then( 
     resolve => {
         result = resolve.rows    
         return result[0];
     })
     .catch(err => console.error(err));
 }

 async function insertMatchingData(column, data){
    if(column === 'verifycount') {
        data = await setVerifyCount(data);
    }
    return await pool.query(`UPDATE matching SET ${column} = ${data} WHERE id = 1;`)
    .then( 
     resolve => {
         result = resolve.rows
         return result[0];
     })
     .catch(err => console.error(err));
 }

 async function setVerifyCount(data) {
    let verifiedCount =  await pool.query(`SELECT verifycount FROM matching`).then(resolve => {result = resolve.rows[0].verifycount; return result});
    verifiedCount += data
    return verifiedCount;
 }

 async function getVerifyCount() {
    let verifiedCount =  await pool.query(`SELECT verifycount FROM matching`).then(resolve => {result = resolve.rows[0].verifycount; return result});
    return verifiedCount;
 }

const matched = async () => {

    const matchedUserArray = [];
    const { cli, dob, postcode } = await selectAllFromMatchingQuery();
    const dbUserArray = await selectAllFromUsersQuery(); 

    let amendedCli;

    if(cli.substring(0,1) !== '0'){
        amendedCli = '0' + cli;
    } else {
        amendedCli = cli;
    }
    
    if(postcode){
       for(user in dbUserArray){
           if(user.postcode === postcode && user.dob === dob && user.contactdetails === amendedCli){
               matchedUserArray.push(user);
           }
       }
    } else {
        
        for(index in dbUserArray){
            if(dbUserArray[index].dob === dob && dbUserArray[index].contactdetails === amendedCli){
                matchedUserArray.push(dbUserArray[index]);
            }
        }
    }
    return matchedUserArray;
}

app.get("/esa",(req, res) => {
    // res.status(200).send({
    //     redirect: "https://idvmock.herokuapp.com/auth"
    // })
    res.redirect("https://idvmock.herokuapp.com/auth");
});

app.get("/auth", (req, res) => {
    //Extract GOTO param from query string
    res.status(200).send({
        redirect: "https://idvmock.herokuapp.com/amtree"
    })
    //res.redirect("https://idvmock.herokuapp.com/amtree");
});

app.post("/amtree", async (req, res) => {

    let response = {
        "cookie": "dthamlbcookie=01; Path=/; Secure; HttpOnly; SameSite=none",
        "callbacks": [{
            "output": [{
                "name": "prompt",
                "value": "Enter CLI telephone number"
            }],
            "input": [{
                "name": "IDToken1",
                "value": ""
            }],
            "type": "NameCallback"
        }],
        "authId":
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRJRFYiLCJvdGsiOiJwbmpnYjlxaXM4bG44aWFiYm02ZjdnMHEwYSIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvQ2l0aXplbnMvVElEViIsInNlc3Npb25JZCI6InVzZGh0WG5wc1A5bWh6dWVYcnFwS2VHdUE3QS4qQUFKVFNRQUNNRElBQWxOTEFCeFlhRXhpVW1sR2VVVjViamhMY25WRFltUjJRakJGWlcwcmNrazlBQVIwZVhCbEFBaERWRk5mUVZWVVNBQUNVekVBQWpBeCoiLCJleHAiOjE2MzcwODMwMTgsImlhdCI6MTYzNzA4MjExOH0.1soDjOUXL2H-dUTxw59kpUSDTfoJJtIIgfjt_R9BaRE"
    }

    if(Object.keys(req.body).length === 0){
        res.status(200).send(response);
    } else {

        let prompt = req.body.callbacks[0].output[0].value;
        let inputValue = req.body.callbacks[0].input[0].value;
        let matchedSize;
        let matchedUsers;
        let challengeQuestion;
        let pipQuestion;
        let outcome = {};
        let verifiedCount = 0;
        let sso;
        
        try{
            let obj = JSON.parse(prompt);
            if(obj.hasOwnProperty('fieldId')){
                prompt = obj.fieldId;
            }
        } catch(err){
            console.error(`value is not an Object`);
        }
        
        console.log(`Challenge question: ${prompt}`);

        if(challenges.includes(prompt)){
            
            switch(prompt){  

                case "Enter CLI telephone number":

                    //Add cli to the matching table.
                    
                    await insertMatchingData("cli", inputValue);

                    response = {
                        "callbacks": [{
                            "output": [{
                                "name": "prompt",
                                "value": "Date of Birth"
                            }],
                            "input": [{
                                "name": "IDToken1",
                                "value": ""
                            }],
                            "type": "NameCallback"
                        }],
                        "authId":
                        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRJRFYiLCJvdGsiOiI4b3RiYjYzZzhhMjdjNW8zYWpyMGhrZWJtbyIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvQ2l0aXplbnMvVElEViIsInNlc3Npb25JZCI6InVzZGh0WG5wc1A5bWh6dWVYcnFwS2VHdUE3QS4qQUFKVFNRQUNNRElBQWxOTEFCeFlhRXhpVW1sR2VVVjViamhMY25WRFltUjJRakJGWlcwcmNrazlBQVIwZVhCbEFBaERWRk5mUVZWVVNBQUNVekVBQWpBeCoiLCJleHAiOjE2MzcwODMwMTgsImlhdCI6MTYzNzA4MjExOH0.3Nep_KEA4sTolvRg2VIU7J9g6whlQYiR8zq2CjtoX1I",
                        "url":"https://10.80.131.18/am/json/realms/root/realms/Citizens/realms/TIDV/authenticate?service=TIDV&authIndexType=service&authIndexValue=TIDV&random=3a5320c5-efab-2066-d4a2-96615e9ebf7c-1"
                    }
                    break;

                case "Date of Birth":
                
                    challengeQuestion = cis_challenges[Math.floor(Math.random() * cis_challenges.length)];
                    
                    response = {
                        "cookie": "dthamlbcookie=01; Path=/; Secure; HttpOnly; SameSite=none",
                        "callbacks": [{
                            "output": [{
                                "name": "prompt",
                                "value": ""
                            }],
                            "input": [{
                                "name": "IDToken1",
                                "value": ""
                            }],
                            "type": "NameCallback"
                        }],
                        "authId":
                        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRJRFYiLCJvdGsiOiJwbmpnYjlxaXM4bG44aWFiYm02ZjdnMHEwYSIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvQ2l0aXplbnMvVElEViIsInNlc3Npb25JZCI6InVzZGh0WG5wc1A5bWh6dWVYcnFwS2VHdUE3QS4qQUFKVFNRQUNNRElBQWxOTEFCeFlhRXhpVW1sR2VVVjViamhMY25WRFltUjJRakJGWlcwcmNrazlBQVIwZVhCbEFBaERWRk5mUVZWVVNBQUNVekVBQWpBeCoiLCJleHAiOjE2MzcwODMwMTgsImlhdCI6MTYzNzA4MjExOH0.1soDjOUXL2H-dUTxw59kpUSDTfoJJtIIgfjt_R9BaRE"
                    }

                    //Add the DOB matching table.
                    inputValue = inputValue.split('-').join("");
                    await insertMatchingData("dob", inputValue);

                    matchedUsers = await matched();
                    matchedSize = matchedUsers.length;


                    if(matchedSize === 1){
                        //outcome.fieldId = challengeQuestion;
                        outcome.fieldId = "cis_benefit";
                        //outcome.verifiedValue = matched[0].challengeQuestion;
                        outcome.verifiedValue = matchedUsers[0].cis_benefit;
                        outcome.inputMode = "";
                        outcome.failureReason = "";
                        outcome.attenmptCount = "";
                        outcome.confirmed = "";
                        outcome.outcome = "";
                        outcome.secondsource = "";
                        //response.callbacks[0].output[0].value = challengeQuestion;
                        response.callbacks[0].output[0].value = JSON.stringify(outcome);
                    } else if(matchedSize > 1) {
                        response.callbacks[0].output[0].value = "postcode";
                    } else {
                        console.error(new Error('Broke'));
                    }
                    break;

                case "postcode":

                    await insertMatchingData("postcode", inputValue);

                    matchedUsers = await matched();
                    matchedSize = matchedUsers.length;
                    challengeQuestion = cis_challenges[Math.floor(Math.random() * cis_challenges.length)];
                   
                    response = {
                        "cookie": "dthamlbcookie=01; Path=/; Secure; HttpOnly; SameSite=none",
                        "callbacks": [{
                            "output": [{
                                "name": "prompt",
                                "value": ""
                            }],
                            "input": [{
                                "name": "IDToken1",
                                "value": ""
                            }],
                            "type": "NameCallback"
                        }],
                        "authId":
                        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRJRFYiLCJvdGsiOiJwbmpnYjlxaXM4bG44aWFiYm02ZjdnMHEwYSIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvQ2l0aXplbnMvVElEViIsInNlc3Npb25JZCI6InVzZGh0WG5wc1A5bWh6dWVYcnFwS2VHdUE3QS4qQUFKVFNRQUNNRElBQWxOTEFCeFlhRXhpVW1sR2VVVjViamhMY25WRFltUjJRakJGWlcwcmNrazlBQVIwZVhCbEFBaERWRk5mUVZWVVNBQUNVekVBQWpBeCoiLCJleHAiOjE2MzcwODMwMTgsImlhdCI6MTYzNzA4MjExOH0.1soDjOUXL2H-dUTxw59kpUSDTfoJJtIIgfjt_R9BaRE"
                    }
                    

                    if(matchedSize === 1){
                        //outcome.fieldId = challengeQuestion;
                        outcome.fieldId = "cis_benefit";
                        //outcome.verifiedValue = matched[0].challengeQuestion;
                        outcome.verifiedValue = matchedUsers[0].cis_benefit;
                        outcome.inputMode = "";
                        outcome.failureReason = "";
                        outcome.attenmptCount = "";
                        outcome.confirmed = "";
                        outcome.outcome = "";
                        outcome.secondsource = "";
                        response.callbacks[0].output[0].value = JSON.stringify(outcome);
                    } else {
                        console.error(new Error('Broke'));
                    } 
                    break;

                case "cis_benefit":

                    if(JSON.parse(req.body.callbacks[0].output[0].value).outcome){
                       await insertMatchingData('verifycount', 1);
                    }
                       
                    pipQuestion = pip_challenges[Math.floor(Math.random() * pip_challenges.length)];
                    console.log(`Question Selected was: ${pipQuestion}`);

                    matchedUsers = await matched();

                    outcome.fieldId = pipQuestion;
                    outcome.verifiedValue = matchedUsers[0][pipQuestion];
                    outcome.inputMode = "";
                    outcome.failureReason = "";
                    outcome.attenmptCount = "";
                    outcome.confirmed = "";
                    outcome.outcome = "";
                    outcome.secondsource = "PIP";

                    response = {
                        "cookie": "dthamlbcookie=01; Path=/; Secure; HttpOnly; SameSite=none",
                        "callbacks": [{
                            "output": [{
                                "name": "prompt",
                                "value": ""
                            }],
                            "input": [{
                                "name": "IDToken1",
                                "value": ""
                            }],
                            "type": "NameCallback"
                        }],
                        "authId":
                        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRJRFYiLCJvdGsiOiJwbmpnYjlxaXM4bG44aWFiYm02ZjdnMHEwYSIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvQ2l0aXplbnMvVElEViIsInNlc3Npb25JZCI6InVzZGh0WG5wc1A5bWh6dWVYcnFwS2VHdUE3QS4qQUFKVFNRQUNNRElBQWxOTEFCeFlhRXhpVW1sR2VVVjViamhMY25WRFltUjJRakJGWlcwcmNrazlBQVIwZVhCbEFBaERWRk5mUVZWVVNBQUNVekVBQWpBeCoiLCJleHAiOjE2MzcwODMwMTgsImlhdCI6MTYzNzA4MjExOH0.1soDjOUXL2H-dUTxw59kpUSDTfoJJtIIgfjt_R9BaRE"
                    }

                    response.callbacks[0].output[0].value = JSON.stringify(outcome);
                    break;

                case "pip_pay_day":
                case "pip_lastpayment_date":
                case "pip_lastpayment_amount":
                case "pip_bank_details":
                case "pip_sort_code":
                case "pip_component":

                    if(JSON.parse(req.body.callbacks[0].output[0].value).outcome){
                        await insertMatchingData("verifycount", 1);
                    }

                    matchedUsers = await matched();
                    verifiedCount = await getVerifyCount();
                    
                    if(verifiedCount >= 1){
                        response = {
                            "tokenId" : matchedUsers[0].sso,
                        }
                    } else {
                        //TODO - Create Error Response
                        response = {
                            "error" : {
                                "failureUrl" : "",
                                "detail" : ""
                            }
                        }
                    }

                    break; 
            }    
        }
        res.status(200).send(response);
    }
})


//TODO - Check endpoint from real app CSRF = header maybe ->  may not require it.
app.post("payments/esa", (req, res) => {
    
});

app.post("/cognitio", (req, res) => {

});

app.post("/guid/:guid", async (req, res) => {
   let guid = req.params.guid;
   let nino = await getNINO(guid);
})

    