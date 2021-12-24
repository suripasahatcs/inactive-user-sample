const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');


async function apicall(orgs,PAtoken){

    const config = {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: 'Bearer ' + PAtoken //the token is a variable which holds the token
      }
    }
    await axios.get(`https://api.github.com/orgs/{orgs}/members`, config)
    .then(response => {
      console.log(response)
      return response;
    })
    .catch(error => {
      console.log(error)
      core.setFailed(error);
    })

}


try {
  // `who-to-greet` input defined in action metadata file
  const PAtoken = core.getInput('token');
  const orgsname = core.getInput('orgs-name');
  console.log(`Hello ${orgsname}!`);
  const APIRes = apicall(orgsname,PAtoken);
  // const time = (new Date()).toTimeString();
  core.setOutput("status", APIRes);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}