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

//Required to listen to specific port for Heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

//To make the application deal with JSON
app.use(express.json());

const challenges = ["Enter CLI telephone number", "Date of Birth", "phone number", "postcode", "nino",
"cis_home_phone", "cis_mobile_phone", "cis_benefit", "cis_childs_dob", "cis_partners_nino", "cis_partners_dob","cis_childs_name",
"pip_last_payment_amount", "pip_last_payment_date","pip_pay_day", "pip_bank_details", "pip_sort_code","pip_components"];
const cis_challenges = ["cis_home_phone", "cis_mobile_phone", "cis_benefit", "cis_childs_dob", "cis_partners_nino", "cis_partners_dob","cis_childs_name"];
const pip_challenges = ["pip_last_payment_amount", "pip_last_payment_date","pip_pay_day", "pip_bank_account", "pip_sort_code","pip_components"];


async function selectAllFromUsersQuery(){
    let data = [];
    return await pool.query(`SELECT * FROM Users;`)
    .then( 
     resolve => {
         result = resolve.rows;

         if(result.length === 1){
             data.push(result[0]);
         } else {
             for(let i = 0; i < result.length; i++){
                 data.push(result[i]);
             }
         }
         return data; 
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
    return await pool.query(`SELECT nino FROM guid WHERE guid = '${guid}';`)
    .then( 
     resolve => {
         result = resolve.rows    
         return result[0];
     })
     .catch(err => console.error(err));
 }

 async function insertMatchingData(column, data){
    console.log(`Adding ${data} to ${column} within Matching table`);
    if(column === 'verifycount') {
        data = await setVerifyCount(data);
    }
    return await pool.query(`UPDATE matching SET ${column} = '${data}' WHERE id = 1;`)
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
    console.log(`MatchedUsers : ${JSON.stringify(matchedUserArray)}`);
    return matchedUserArray;
}


app.get("/esa", async (req, res) => {
    
    let sso = req.headers.csrf;
    if(sso !== undefined){
        let matchedUsers = await matched();
        let paymentAmmount = matchedUsers[0].payment_amount;
        let paymentDate = matchedUsers[0].payment_date;
        let response = {
            "cookie":"session=zVfks8vlXIh_mTNBdxiWAg|1637085811|N54qP1jahVd6BcPh0Rr_W2fUoOCzgrzRzsxPBdXk5jw0Hj4TpJaW9mXhQ1M6stFViBSzWwvaQTFElxEvikqLTSrcwfnKnzH0RZavjhTJFrza_M9oVnmAdnwSZBNcmWZvGLJUEOJ5RVPCB5QRYz2wVhIPX3YGMLUxDfNlVwIfjpGuAnSuet7CTUufH5X5HloOAi6L8hPJsqdjOEw544n3iMhoWVrxqbC89EForIMd4a_WnOihZUEXlLXoM4Fu462jrUQcmIdtLaqCO11NEtnFi0LLn_r_tRy3P7FEPKomNN4lX_e6QH4sTgGQp3UwsrPCU3tBi817NA961-FKTQ2sqzQYgoXUsYpyCiIhKab8QpgSamZftY47s9sLCXF3Jh9n6HZkln_Xe0xD1o5EyuK3sodR6Ou3WMVefpnacRKCft6q1mzJZjGO9UUWpBKbsMGDLWfzeA4F9HKBtTshPFMYUyVmEmq0dS5KX8M0pESpTe5by6KuHpG33G03atWPPCcgBtndyhkkieGUd5wWVy1_hNd8XFTMMYHVgpBq0Nlj53_p8jNRjIZzQkvW4f9KJEQkVtxaMhB0JmV4LdhlJxtSkbqOO-yYSdfF0U1dP33-RHvxW1Uh0Jv5zcvrT5Tsfclua-KO8avLWTvyHw-LuscLLOlbuWjtvt3EV1UXcV7fcw8fU8RvClHEZdb0pVhg_1awE2HhTGVsK1_3urtUwAN0fglIPMx6YXNpAAzRjcXTyQXjy77qq-3qymvF71GjUJrCCinY_T3-b3AQ84eMfnXbaXGOr7ZOXfFkbUzmApT6-E3Gi7x45kjnM_B7iA4dmhWGM1hjIJP6kOKPwsOm1yQMmmold51j3JaDjbrYA3V8kxFMZ_C4F1Yb1MczLoa80YSeIqU3Q8d8PaU__Muq1-46dtRU6Any-suBnN1hJ5ejhfnsTEaoLSW8xWsxIXqRAsAsrLRyYfGuICf3OgA-98LdK19YvSVMsZBJTkQzcvgpHz_vI0C8M7USNp6rIUy2FelZ0YIAkaXeIJZj7Je7cskzPsYvwp1ZaLhIY2uUtobLZHKjNbKUFby8y03OMhUgIoTFu-CGbNK5T0yJ5bLjYqjGRd7efYW2Ru3rimryxEmbEcEQlqDXveOIlYLQdjwDBjkojNLeje6zvzhlAAJmYUo_TniOBRI1QDv5Sryye4TDNz-Z30ZEH38kcYo9B7sm_zckNoUHg2iu_wFyrZtvRrnZ7rAC1KcAew0GULisXarDNfCbVnCFnn-OH8tUlwDTldTVsb99WgyFhJeGkLe7NEIxfaRjJ--KdpmjgraCnibykBduiVBNmiIXg55lCVfGiE_YarrHI_4fsBa5DvK6riycLOQ4ZGgj44ZXhk9WXUOFLgU_01xM24OBxY9U14_jRjJnwkCa4fwpFemFQZAy7voaic83GqjZndSBzB9mZoAyo4wkg9Oi0FGpYj0rEu2qFOlewnqibDELeAz7jzVII0SxzbAVfVabQrLFlEL9ZvMvEEG75jmtpc_Ap7YWjc8bUBap_KAzDcqn5iz9GiTMrvdObzWwFwIPoUaEHra6030HviDgJVCFTORGLGFxyoyTIyWO_JUiLxkaRIX4WaYI0Iq330rUoSE1fqwOUdtQ57wPLP3vLNWQe7Wu9-SUEe7fzXcRs2FFsGgggtwiozVFDyvxEP_HwdFo5aokRrSSuhHQbnduRhCzSs5LbuBz9BuEYMf0u4XAX2Fg4nP3fkaeGVvtbPOAKLwcglMvMFrC9GoENs3beBYFKpEDqspnzEPiiECqGNbV4YoEiM0CVa0NXBlpVYYGMkg7jDrtqUdfYzWeKhyuA2RUhEbpb3RFm5nTjkDjdYcvZewIor1UiENhkMbPhpnbnKu6Vj6L7jLIaRkjwvUMm1zg9aBdHRbv1zx9H32fwcFqeI3g6OTmU1LODG1yXbmrsBDnFuaJ0uCA6_ll|pH5F37swVT_07fr9JlRSKGUa7Pk; Path=/; SameSite=Lax; Secure;HttpOnly",
               "guid": matchedUsers[0].guid,
               "paymentDate": paymentDate,
               "paymentAmount": paymentAmmount
        }
        res.status(200).send(response);
    } else {
        //res.set('Set-Cookie','authorization=VLBdXT5S60UYq8NklwnikA|1631721393|pzgtRtH0gddOL8CxH2VkEDs8w5d73tugPBb6d0j0tm1FQ3FF6L0CUtYJXCmi17Sm7bXsKnK7k-vh-rK_9r9ktenim8mAVG7ivAkQCAfSnbkKPWnKGNni84FkbbWzIANZQe5XS2uA3_vDYqGYPjMPVoE814KrVPBviZpDHzNIXT0bzeSj7uFpYlrGFi-hTkX_yPIWbUv7kMpapAzYOWohCg|rMtXnUX3F9_15e6auSnNGnE6N-A; Path=/; Secure; HttpOnly');
        res.status(200).send({"Set-Cookie" : "authorization=VLBdXT5S60UYq8NklwnikA|1631721393|pzgtRtH0gddOL8CxH2VkEDs8w5d73tugPBb6d0j0tm1FQ3FF6L0CUtYJXCmi17Sm7bXsKnK7k-vh-rK_9r9ktenim8mAVG7ivAkQCAfSnbkKPWnKGNni84FkbbWzIANZQe5XS2uA3_vDYqGYPjMPVoE814KrVPBviZpDHzNIXT0bzeSj7uFpYlrGFi-hTkX_yPIWbUv7kMpapAzYOWohCg|rMtXnUX3F9_15e6auSnNGnE6N-A; Path=/; Secure; HttpOnly",
        "redirect" : "https://idvmock.herokuapp.com/auth"
        });
        //res.redirect("https://idvmock.herokuapp.com/auth");
    }   
});

app.get("/pip", async (req, res) => {
    let sso = req.headers.csrf;
    if(sso !== undefined){
        let matchedUsers = await matched();
        let paymentAmmount = matchedUsers[0].payment_amount;
        let paymentDate = matchedUsers[0].payment_date;
        let response = {
            "cookie":"session=zVfks8vlXIh_mTNBdxiWAg|1637085811|N54qP1jahVd6BcPh0Rr_W2fUoOCzgrzRzsxPBdXk5jw0Hj4TpJaW9mXhQ1M6stFViBSzWwvaQTFElxEvikqLTSrcwfnKnzH0RZavjhTJFrza_M9oVnmAdnwSZBNcmWZvGLJUEOJ5RVPCB5QRYz2wVhIPX3YGMLUxDfNlVwIfjpGuAnSuet7CTUufH5X5HloOAi6L8hPJsqdjOEw544n3iMhoWVrxqbC89EForIMd4a_WnOihZUEXlLXoM4Fu462jrUQcmIdtLaqCO11NEtnFi0LLn_r_tRy3P7FEPKomNN4lX_e6QH4sTgGQp3UwsrPCU3tBi817NA961-FKTQ2sqzQYgoXUsYpyCiIhKab8QpgSamZftY47s9sLCXF3Jh9n6HZkln_Xe0xD1o5EyuK3sodR6Ou3WMVefpnacRKCft6q1mzJZjGO9UUWpBKbsMGDLWfzeA4F9HKBtTshPFMYUyVmEmq0dS5KX8M0pESpTe5by6KuHpG33G03atWPPCcgBtndyhkkieGUd5wWVy1_hNd8XFTMMYHVgpBq0Nlj53_p8jNRjIZzQkvW4f9KJEQkVtxaMhB0JmV4LdhlJxtSkbqOO-yYSdfF0U1dP33-RHvxW1Uh0Jv5zcvrT5Tsfclua-KO8avLWTvyHw-LuscLLOlbuWjtvt3EV1UXcV7fcw8fU8RvClHEZdb0pVhg_1awE2HhTGVsK1_3urtUwAN0fglIPMx6YXNpAAzRjcXTyQXjy77qq-3qymvF71GjUJrCCinY_T3-b3AQ84eMfnXbaXGOr7ZOXfFkbUzmApT6-E3Gi7x45kjnM_B7iA4dmhWGM1hjIJP6kOKPwsOm1yQMmmold51j3JaDjbrYA3V8kxFMZ_C4F1Yb1MczLoa80YSeIqU3Q8d8PaU__Muq1-46dtRU6Any-suBnN1hJ5ejhfnsTEaoLSW8xWsxIXqRAsAsrLRyYfGuICf3OgA-98LdK19YvSVMsZBJTkQzcvgpHz_vI0C8M7USNp6rIUy2FelZ0YIAkaXeIJZj7Je7cskzPsYvwp1ZaLhIY2uUtobLZHKjNbKUFby8y03OMhUgIoTFu-CGbNK5T0yJ5bLjYqjGRd7efYW2Ru3rimryxEmbEcEQlqDXveOIlYLQdjwDBjkojNLeje6zvzhlAAJmYUo_TniOBRI1QDv5Sryye4TDNz-Z30ZEH38kcYo9B7sm_zckNoUHg2iu_wFyrZtvRrnZ7rAC1KcAew0GULisXarDNfCbVnCFnn-OH8tUlwDTldTVsb99WgyFhJeGkLe7NEIxfaRjJ--KdpmjgraCnibykBduiVBNmiIXg55lCVfGiE_YarrHI_4fsBa5DvK6riycLOQ4ZGgj44ZXhk9WXUOFLgU_01xM24OBxY9U14_jRjJnwkCa4fwpFemFQZAy7voaic83GqjZndSBzB9mZoAyo4wkg9Oi0FGpYj0rEu2qFOlewnqibDELeAz7jzVII0SxzbAVfVabQrLFlEL9ZvMvEEG75jmtpc_Ap7YWjc8bUBap_KAzDcqn5iz9GiTMrvdObzWwFwIPoUaEHra6030HviDgJVCFTORGLGFxyoyTIyWO_JUiLxkaRIX4WaYI0Iq330rUoSE1fqwOUdtQ57wPLP3vLNWQe7Wu9-SUEe7fzXcRs2FFsGgggtwiozVFDyvxEP_HwdFo5aokRrSSuhHQbnduRhCzSs5LbuBz9BuEYMf0u4XAX2Fg4nP3fkaeGVvtbPOAKLwcglMvMFrC9GoENs3beBYFKpEDqspnzEPiiECqGNbV4YoEiM0CVa0NXBlpVYYGMkg7jDrtqUdfYzWeKhyuA2RUhEbpb3RFm5nTjkDjdYcvZewIor1UiENhkMbPhpnbnKu6Vj6L7jLIaRkjwvUMm1zg9aBdHRbv1zx9H32fwcFqeI3g6OTmU1LODG1yXbmrsBDnFuaJ0uCA6_ll|pH5F37swVT_07fr9JlRSKGUa7Pk; Path=/; SameSite=Lax; Secure;HttpOnly",
               "guid": matchedUsers[0].guid,
               "paymentDate": paymentDate,
               "paymentAmount": paymentAmmount
        }
        res.status(200).send(response);
    } else {
        //res.set('Set-Cookie','authorization=VLBdXT5S60UYq8NklwnikA|1631721393|pzgtRtH0gddOL8CxH2VkEDs8w5d73tugPBb6d0j0tm1FQ3FF6L0CUtYJXCmi17Sm7bXsKnK7k-vh-rK_9r9ktenim8mAVG7ivAkQCAfSnbkKPWnKGNni84FkbbWzIANZQe5XS2uA3_vDYqGYPjMPVoE814KrVPBviZpDHzNIXT0bzeSj7uFpYlrGFi-hTkX_yPIWbUv7kMpapAzYOWohCg|rMtXnUX3F9_15e6auSnNGnE6N-A; Path=/; Secure; HttpOnly');
        res.status(200).send({"Set-Cookie" : "authorization=VLBdXT5S60UYq8NklwnikA|1631721393|pzgtRtH0gddOL8CxH2VkEDs8w5d73tugPBb6d0j0tm1FQ3FF6L0CUtYJXCmi17Sm7bXsKnK7k-vh-rK_9r9ktenim8mAVG7ivAkQCAfSnbkKPWnKGNni84FkbbWzIANZQe5XS2uA3_vDYqGYPjMPVoE814KrVPBviZpDHzNIXT0bzeSj7uFpYlrGFi-hTkX_yPIWbUv7kMpapAzYOWohCg|rMtXnUX3F9_15e6auSnNGnE6N-A; Path=/; Secure; HttpOnly",
        "redirect" : "https://idvmock.herokuapp.com/auth"
        });
        //res.redirect("https://idvmock.herokuapp.com/auth");
    }   
});

app.get("/auth", (req, res) => {
    res.status(200).send({
        "goto" : "https%3A%2F%2Fidvmock.herokuapp.com%2Fsso%3Fresponse_type%3Dcode%26client_id%3DCxP-PIP-TIDV%26state%3DN7jkkSZGjYgiiIbbBUvHr97%26response_mode%3Dquery%26redirect_uri%3Dhttps%253A%252F%252Fidvmock.herokuapp.com%252F%26nonce%3DQYd65VfiBfG6h0Ugqhd1wUFK%26scope%3Dopenid%2520guid",
        "redirect" : "https://idvmock.herokuapp.com/login?realm=%2FCitizens%2FTIDV&authIndexType=service&authIndexValue=TIDV&goto=https%3A%2F%2Fidvmock.herokuapp.com%2Fsso%3Fresponse_type%3Dcode%26client_id%3DCxP-PIP-TIDV%26state%3DN7jkkSZGjYgiiIbbBUvHr97%26response_mode%3Dquery%26redirect_uri%3Dhttps%253A%252F%252Fidvmock.herokuapp.com%252F%26nonce%3DQYd65VfiBfG6h0Ugqhd1wUFK%26scope%3Dopenid%2520guid"})
    //res.redirect("https://idvmock.herokuapp.com/login?realm=%2FCitizens%2FTIDV&authIndexType=service&authIndexValue=TIDV&goto=https%3A%2F%2Fidvmock.herokuapp.com%2Fsso%3Fresponse_type%3Dcode%26client_id%3DCxP-PIP-TIDV%26state%3DN7jkkSZGjYgiiIbbBUvHr97%26response_mode%3Dquery%26redirect_uri%3Dhttps%253A%252F%252Fidvmock.herokuapp.com%252F%26nonce%3DQYd65VfiBfG6h0Ugqhd1wUFK%26scope%3Dopenid%2520guid");
});

app.get("/login", (req, res) => {
    res.status(500).send({
        "code": 500,
        "reason": "Bad Request",
        "message": "Should not have arrived here silly",
        "detail":{
            "failureUrl": "Should not have arrived here silly"
        }
    })
})

app.post("/amtree", async (req, res) => {

    let prompt;
    let inputValue;
    let matchedSize;
    let matchedUsers;
    let challengeQuestion;
    let pipQuestion;
    let outcome = {};
    let verifiedCount = 0;

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

        prompt = req.body.callbacks[0].output[0].value;
        //console.log(` Input value is : ${req.body.callbacks[0].input[0].value}`);
        if(req.body.callbacks[0].input[0].value !== ""){
            inputValue = JSON.parse(req.body.callbacks[0].input[0].value).outcome;
        } else {
            inputValue = req.body.callbacks[0].input[0].value;
        }
        

        if(prompt.hasOwnProperty("fieldId")){
            prompt = prompt.fieldId;
        }

        if(challenges.includes(prompt)){
            console.log(`Challenge Selected is: ${prompt}`);
            switch(prompt){  

                case "Enter CLI telephone number":
                
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
                        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRJRFYiLCJvdGsiOiI4b3RiYjYzZzhhMjdjNW8zYWpyMGhrZWJtbyIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvQ2l0aXplbnMvVElEViIsInNlc3Npb25JZCI6InVzZGh0WG5wc1A5bWh6dWVYcnFwS2VHdUE3QS4qQUFKVFNRQUNNRElBQWxOTEFCeFlhRXhpVW1sR2VVVjViamhMY25WRFltUjJRakJGWlcwcmNrazlBQVIwZVhCbEFBaERWRk5mUVZWVVNBQUNVekVBQWpBeCoiLCJleHAiOjE2MzcwODMwMTgsImlhdCI6MTYzNzA4MjExOH0.3Nep_KEA4sTolvRg2VIU7J9g6whlQYiR8zq2CjtoX1I"
                    }
                    break;

                case "Date of Birth":
                
                    //challengeQuestion = cis_challenges[Math.floor(Math.random() * cis_challenges.length)];
                    challengeQuestion = 'cis_home_phone'
                    
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

                    inputValue = inputValue.split('-').join(""); 
                    await insertMatchingData("dob", inputValue);

                    matchedUsers = await matched();
                    matchedSize = matchedUsers.length;


                    if(matchedSize === 1){
                        outcome.fieldId = challengeQuestion;
                        outcome.verifiedValue = matchedUsers[0][challengeQuestion];
                        outcome.inputMode = "";
                        outcome.failureReason = "";
                        outcome.attemptCount = "";
                        outcome.confirmed = "";
                        outcome.outcome = "";
                        outcome.secondsource = "";
                        response.callbacks[0].output[0].value = JSON.stringify(outcome);
                    } else if(matchedSize > 1) {
                        response.callbacks[0].output[0].value = "postcode";
                    } else {
                        response.callbacks[0].output[0].value = "phone number";
                    }
                    break;

                case "postcode":

                    await insertMatchingData("postcode", inputValue);

                    matchedUsers = await matched();
                    matchedSize = matchedUsers.length;
                    //challengeQuestion = cis_challenges[Math.floor(Math.random() * cis_challenges.length)];
                    challengeQuestion = 'cis_home_phone';
                   
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
                        outcome.fieldId = challengeQuestion;
                        outcome.verifiedValue = matchedUsers[0][challengeQuestion];
                        outcome.inputMode = "";
                        outcome.failureReason = "";
                        outcome.attemptCount = "";
                        outcome.confirmed = "";
                        outcome.outcome = "";
                        outcome.secondsource = "";
                        response.callbacks[0].output[0].value = JSON.stringify(outcome);
                    } else {
                        console.error(new Error('No Users returned using postcode disambiguator'));
                        response = {
                            "code":401,
                            "reason":"Unauthorized",
                            "message":"Login failure",
                            "detail":{
                                "failureUrl":"No Users returned using postcode disambiguator"
                            }
                        }
                    } 
                    break;

                case "phone number":

                    await insertMatchingData("cli", inputValue);

                    matchedUsers = await matched();
                    matchedSize = matchedUsers.length;
                    //challengeQuestion = cis_challenges[Math.floor(Math.random() * cis_challenges.length)];
                    challengeQuestion = 'cis_home_phone';
                    
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
                        outcome.fieldId = challengeQuestion;
                        outcome.verifiedValue = matchedUsers[0][challengeQuestion];
                        outcome.inputMode = "";
                        outcome.failureReason = "";
                        outcome.attemptCount = "";
                        outcome.confirmed = "";
                        outcome.outcome = "";
                        outcome.secondsource = "";
                        response.callbacks[0].output[0].value = JSON.stringify(outcome);
                    } else if(matchedSize > 1) {
                        response.callbacks[0].output[0].value = "postcode";
                    } else {
                        console.error(new Error('No Users returned using User Entered Phone Number'));
                        response = {
                            "code":401,
                            "reason":"Unauthorized",
                            "message":"Login failure",
                            "detail":{
                                "failureUrl":"No Users returned using User Entered Phone Number"
                            }
                        }
                    }     
                    break;

                case "cis_benefit":
                case "cis_home_phone":
                case "cis_mobile_phone":
                case "cis_childs_dob":
                case "cis_partners_nino":
                case "cis_partners_dob":
                case "cis_childs_name":

                    console.log(`Request for CIS Based Challenge is: ${JSON.stringify(req)}`);
                    if(req.body.callbacks[0].output[0].value.outcome){
                       await insertMatchingData('verifycount', 1);
                    }
                       
                    //pipQuestion = pip_challenges[Math.floor(Math.random() * pip_challenges.length)];
                    pipQuestion = 'pip_bank_details';

                    matchedUsers = await matched();

                    outcome.fieldId = pipQuestion;
                    console.log(`PIP Verified question is returned as: ${matchedUsers[0][pipQuestion]}`);
                    outcome.verifiedValue = matchedUsers[0][pipQuestion];
                    console.log(`pip Verified question is: ${outcome.verifiedValue}`);
                    outcome.inputMode = "";
                    outcome.failureReason = "";
                    outcome.attemptCount = "";
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

                    console.log(`Request for PIP Based Challenge is: ${JSON.stringify(req)}`);

                    if(req.body.callbacks[0].output[0].value.outcome){
                        await insertMatchingData("verifycount", 1);
                    }

                    matchedUsers = await matched();
                    verifiedCount = await getVerifyCount();
                    console.log(`Verified count is: ${verifiedCount}`);
                    
                    if(verifiedCount >= 1){
                        response = {
                            "tokenId" : matchedUsers[0].sso,
                        }
                    } else {
                        response = {
                                "code": 401,
                                "reason": "Unauthorized",
                                "message": "User not verified",
                                "detail":{
                                    "failureUrl": "User has not verified"
                                }
                        }
                    }
                    break;
            }    
        }
        res.status(200).send(response);
    }
})

app.post("/sso", (req, res) => {
    let ssoToken = req.headers.crsf;
    if(ssoToken === undefined){
        res.status(500).send({
            "code": 500,
            "reason": "Bad Request",
            "message": "No SSO Token Supplied",
            "detail":{
                "failureUrl": "No SSO Token Supplied"
            }
        })
    }
    res.status(200).send({"redirect": "https://idvmock.herokuapp.com/esa"});
    //res.redirect("https://idvmock.herokuapp.com/esa");
})

app.post("/cognitio", (req, res) => {
    res.status(200).send({
        "id" : "123456FTG7890"
    })
});

app.get("/guid/:guid", async (req, res) => {
   let congnitioId = req.headers.cogid;
   if(congnitioId !== undefined){
    let guid = req.params.guid;
    let nino = await getNINO(guid);
    res.status(200).send(nino);
   } else {
    res.status(500).send(
        {
            "code": 500,
            "reason": "Bad Request",
            "message": "No Cognitio ID Supplied",
            "detail":{
                "failureUrl": "No Cognitio ID Supplied"
            }
    })
   }
})

    