// const github = require('@actions/github')
//   , core = require('@actions/core')
const fs = require('fs')
  , path = require('path')
  , core = require('@actions/core')
  , io = require('@actions/io')
  , json2csv = require('json2csv')
  , OrganizationActivity = require('./src/OrgsUserActivity')
  , githubClient = require('./src/githublib/githubClient')
  , dateUtil = require('./src/dateUtil')
;

async function run() {
  const since = core.getInput('since')
    , days = core.getInput('activity_days')
    , token = getRequiredInput('token')
    , outputDir = getRequiredInput('outputDir')
    , organization = getRequiredInput('organization')
    , maxRetries = getRequiredInput('octokit_max_retries')
  ;

  let fromDate;
  if (since) {
    console.log(`Since Date has been specified, using that instead of active_days`)
    fromDate = dateUtil.getFromDate(since);
  } else {
    fromDate = dateUtil.convertDaysToDate(days);
  }

  // Ensure that the output directory exists before we our limited API usage
  await io.mkdirP(outputDir)

  const octokit = githubClient.create(token, maxRetries)
    , orgActivity = new OrganizationActivity(octokit)
  ;

  console.log(`Attempting to generate organization user activity data, this could take some time...`);
  const userActivity = await orgActivity.getUserActivity(organization, fromDate);
  const jsonresp = userActivity.map(activity => activity.jsonPayload);
  const userlist = jsonresp.filter(user => { return user.isActive === false });

  const testuserlist = [{login:'amolmandloi037'},{login:'suripasahatcs'},{login:'mani'}];
  console.log(`before - ${testuserlist} `)
  console.log('before')

  for(const rmuserlist of testuserlist){
    let user1 = rmuserlist.login;
    let removeuserActivity = await orgActivity.getremoveUserData(organization, user1);
    if(removeuserActivity.status === 'success'){
      Object.assign(rmuserlist,{status:' removed'});
    }else{
      Object.assign(rmuserlist,{status:'not removed'});
    }
  }
  
  // const testremoveduser = await removeUserFromOrg(testuserlist);
  
  console.log(testuserlist)
  // saveIntermediateData(outputDir, userActivity.map(activity => activity.jsonPayload));
 
  
  core.setOutput('rmuserjson', testuserlist);
  core.setOutput('report_json', userlist);
  core.setOutput('usercount', jsonlist.length);
  core.setOutput('message', 'Success');

  // Convert the JavaScript objects into a JSON payload so it can be output
  console.log(`User activity data captured, generating inactive user report... `);
  // const data = userActivity.map(activity => activity.jsonPayload)
  //   , csv = json2csv.parse(data, {})
  // ;

  // const file = path.join(outputDir, 'organization_user_activity.csv');
  // fs.writeFileSync(file, csv);
  // console.log(`User Activity Report Generated: ${file}`);

  // Expose the output csv file
  // core.setOutput('report_csv', file);
}

async function execute() {
  try {
    await run();
  } catch (err) {
    core.setFailed(err.message);
  }
}
execute();

async function removeUserFromOrg(rmuserlists) {
  for(const rmuserlist of rmuserlists){
      let user1 = rmuserlist.login;
      let removeuserActivity = await orgActivity.getremoveUserData(organization, user1);
      if(removeuserActivity.status === 'success'){
        Object.assign(rmuserlist,{status:' removed'});
      }else{
        Object.assign(rmuserlist,{status:'not removed'});
      }
    }
  return rmuserlists;
}

function getRequiredInput(name) {
  return core.getInput(name, {required: true});
}

function saveIntermediateData(directory, data) {
  try {
    const file = path.join(directory, 'organization_user_activity.json');
    fs.writeFileSync(file, JSON.stringify(data));
    core.setOutput('report_json', file);
  } catch (err) {
    console.error(`Failed to save intermediate data: ${err}`);
  }
}