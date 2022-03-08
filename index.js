const express = require("express");
const fs = require('fs');
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

//Required to listen to specific port for Heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

//To make the application deal with JSON
app.use(express.json());

const challenges = ["Enter CLI telephone number", "Date of Birth", "telephone number", "postcode", "nino",
"CIS_Home_Telephone_Number", "CIS_Mobile_Telephone_Number", "CIS_Benefits", "CIS_Childs_DOB", "CIS_Partners_NINO",
"ESA_Last_Payment_Amount", "ESA_Last_Payment_Date","ESA_Pay_Day", "ESA_Bank_Account", "ESA_Sort_Code",
"PIP_Last_Payment_Amount", "PIP_Last_Payment_Date","PIP_Pay_Day", "PIP_Bank_Account", "PIP_Sort_Code"];
const cis_challenges = ["CIS_Home_Telephone_Number", "CIS_Mobile_Telephone_Number", "CIS_Benefits", "CIS_Childs_DOB", "CIS_Partners_NINO"];
const esa_challenges = ["ESA_Last_Payment_Amount", "ESA_Last_Payment_Date","ESA_Pay_Day", "ESA_Bank_Account", "ESA_Sort_Code"];
const pip_challenges = ["PIP_Last_Payment_Amount", "PIP_Last_Payment_Date","PIP_Pay_Day", "PIP_Bank_Account", "PIP_Sort_Code"];

// const users = [{
//     guid: "",
//     dob: "22-Jun-1986",
//     phone: "07123456789",
//     cis_benefit: "67",
//     cis_childs_name: "Marge Smith",
//     esa_bank_details: "0000",
//     esa_pay_day: "Wed",
//     pip_component: "10001, 10010",
//     pip_last_pay_date: "22-Dec-2022"   
// },{
//     guid: "",
//     dob: "02-Feb-1978",
//     phone: "07123456711",
//     cis_home_phone: "01112435675",
//     cis_benefit: "675",
//     esa_lastpayment_amount: "12345",
//     esa_pay_day: "Fri",
//     pip_lastpayment_amount: "10001",
//     pip_lastpayment_date: "22-Dec-2022"   
// }]

const matched = (phone, dob, postcode) => {
    const matchedUserArray = [];
    
    const dbUserArray = []; //all users from DB

    //Access matching table and extract data


    if(postcode != undefined){
       for(user in dbUserArray){
           if(user.postcode === postcode && user.dob === dob && user.phone === phone){
               matchedUserArray.push(user);
           }
       }
    } else {
        for(user in dbUserArray){
            if(user.dob === dob && user.phone === phone){
                matchedUserArray.push(user);
            }
        }
    }
    
    return matchedUserArray;
}



app.get("/ESA",(req, res) => {
    res.status(200).send({
        redirect: "/Auth"
    })
});

app.get("/Auth", (req, res) => {
    res.status(200).send({
        redirect: "/AMtree"
    })
});

app.post("/AMTree", (req, res) => {

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

        //Run query to get all callers that match. 

        let prompt = req.body.callbacks[0].output[0].value;
        
        if(typeof prompt !== 'string'){
            prompt = prompt.fieldId;
        } 
        
        if(challenges.includes(prompt)){
            switch(prompt){
                 
                case "Enter CLI telephone number":

                    let cli = {
                        cli: req.body.callbacks[0].input[0].value
                    } 

                    //Add cli to the matching table.

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
                
                    let challengeQuestion = cis_challenges[Math.random() * cis_challenges.length];
                    
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
                      
                    let dob = {
                        dob: req.body.callbacks[0].input[0].value
                    }

                    //Add the DOB matching table.
                    //Extract CLI
                    let matchedSize = matching(cli,dob).length;

                    //Find available challenges from matched user within users table. 

                    if(matchedSize === 1){
                        response.callbacks[0].output[0].value = challengeQuestion;
                    } else if(matchedSize < 1) {
                        //TODO Error Response from ID&V App.
                    } else {
                        response.callbacks[0].output[0].value = "postcode";
                    }
                    break;

                case "postcode":

                    let matchedSize = matching(cli,dob,postcode).length;
                    let challengeQuestion = cis_challenges[Math.random() * cis_challenges.length];
                   
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
                        response.callbacks[0].output[0].value = challengeQuestion;
                    } else if(matchedSize < 1) {
                        //TODO Error Response from ID&V App.
                    } else {
                        //TODO Error 
                    }
                    
                    break;

                case "cis_benefit":

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

                    break;
            }

            
        }

        res.status(200).send(response);
    }

    

    
    //1) -> get input value from client
    let value = req.body.callbacks[0].output[0].value;

    
    //2) -> check user matches using telephone number and DOB
    //if more than one user, disambiguate using postcode.
    //3) -> Check what second source is avilable.
    //4) -> Ask Random CIS Based Question with second source flag.
    //5) -> Check and record if successful
    //6) -> Ask second Data Source
    //7) -> Check and record if successful
    //8) -> If >= 1 correct issue SSO
    //9) -> if == 0 send error message
    
    
})
