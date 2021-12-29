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
    , organizationinp = getRequiredInput('organization')
    , maxRetries = getRequiredInput('octokit_max_retries')
    , removeFlag =  getRequiredInput('remove_flag')
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

  //***start */
  let organizationlist = organizationinp.split(',');
  let removeMulUserList = [];
  let jsonfinallist = [];
  let rmvconfrm = 0;
  for(const organization of organizationlist){
    console.log(`Attempting to generate ${organization} - user activity data, this could take some time...`);
    const userActivity = await orgActivity.getUserActivity(organization, fromDate);
    const jsonresp = userActivity.map(activity => activity.jsonPayload);
    const jsonlist = jsonresp.filter(user => { return user.isActive === false });
    console.log(jsonlist)
    console.log(`******* RemoveFlag - ${removeFlag}`)

    // const removeduserlist = [{login:'1649898'},{login:'manitest'}];{login:'amolmandloi037'},
    // const removeduserlist = [{login:'Meiyanthan'},{login:'manitest'}];
    const removeduserlist = jsonlist;
    const removeMulUserRes = await removeMultipleUser(orgActivity, organization, removeduserlist);
    removeMulUserList = [...removeMulUserList, ...removeMulUserRes.removeduserarr];
    jsonfinallist = [...jsonfinallist, ...jsonlist];
    rmvconfrm += removeMulUserRes.rmvlen;
  }

  console.log('******output*******')
  console.log(removeMulUserList);
  console.log('******final*******')
  console.log(jsonfinallist);
  
  
  //***end test */

  /*
  console.log(`Attempting to generate organization user activity data, this could take some time...`);
  const userActivity = await orgActivity.getUserActivity(organization, fromDate);
  const jsonresp = userActivity.map(activity => activity.jsonPayload);
  const jsonlist = jsonresp.filter(user => { return user.isActive === false });

  console.log(`******* RemoveFlag - ${removeFlag}`)

  const removeduserlist = [{login:'1649898'},{login:'manitest'}];
  // const removeduserlist = [{login:'amolmandloi037'},{login:'suripasahatcs'},{login:'manitest'}];
  let rmvconfrm = 0;
  if(removeFlag.toLowerCase() === 'yes'){
    console.log(`**** Attempting to remove inactive user lists from organization - ${removeduserlist.length} ****`)

    for(const rmuserlist of removeduserlist){
      let rmusername = rmuserlist.login;
      let removeuserActivity = await orgActivity.getremoveUserData(organization, rmusername);
      if(removeuserActivity.status === 'success'){
        console.log(`${rmusername} - Inactive users removed from organization`);
        Object.assign(rmuserlist, {status:'removed'});
        rmvconfrm++;
      }else{
        console.log(`${rmusername} - Due to some error not removed from organization`);
        Object.assign(rmuserlist, {status:'not removed'});
      }
    }
  }else{
    console.log(`**** Skipping the remove inactive user lists from organization process. **** `)
    rmvconfrm = removeduserlist.length;
  }
  */

  console.log(`User activity data captured, generating inactive user report... `);
  // saveIntermediateData(outputDir, removeMulUserList);

  // console.log(removeduserlist)
  // console.log(jsonlist)

 
  const totalInactive = jsonfinallist.length;
  console.log(`rmvconfrm - ${rmvconfrm} & totalInactive - ${totalInactive}`)

  core.setOutput('rmuserjson', removeMulUserList);
  core.setOutput('usercount', totalInactive);
  if(rmvconfrm === totalInactive){
    core.setOutput('message', 'Success');
  }else{
    core.setOutput('message', 'Failure');
  }

  // Convert the JavaScript objects into a JSON payload so it can be output
  // console.log(`User activity data captured, generating inactive user report... `);
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


function getRequiredInput(name) {
  return core.getInput(name, {required: true});
}

async function removeMultipleUser(orgActivity, orgsname, removeduserarr){
  let rmvlen = 0;
  if(removeFlag.toLowerCase() === 'yes'){
    console.log(`**** Attempting to remove inactive user lists from - ${orgsname}. Count of ${removeduserarr.length} ****`)

    for(const rmuserlist of removeduserarr){
      let rmusername = rmuserlist.login;
      let removeuserActivity = await orgActivity.getremoveUserData(orgsname, rmusername);
      if(removeuserActivity.status === 'success'){
        console.log(`${rmusername} - Inactive users removed from - ${orgsname}`);
        Object.assign(rmuserlist, {status:'removed'});
        rmvlen++;
      }else{
        console.log(`${rmusername} - Due to some error not removed from - ${orgsname}`);
        Object.assign(rmuserlist, {status:'not removed'});
      }
    }
  }else{
    console.log(`**** Skipping the remove inactive user lists from - ${orgsname} process. **** `)
    rmvlen = removeduserarr.length;
  }

  return {removeduserarr: removeduserarr, rmvlen: rmvlen};
}

function saveIntermediateData(directory, data) {
  try {
    const file = path.join(directory, 'organization_removed_users.json');
    fs.writeFileSync(file, JSON.stringify(data));
    core.setOutput('report_json', file);
  } catch (err) {
    console.error(`Failed to save intermediate data: ${err}`);
  }
}