
module.exports = class RemoveUser {

    constructor(octokit) {
        if(!octokit) {
            throw new Error('An octokit client must be provided');
        }
        this._octokit = octokit;
    }

    getRemoveUserFrom(org) {
        
        return this.octokit.paginate("GET /orgs/:org/members", 
            {
                org: org, 
                per_page: 100
            }
        ).then(members => {
            return members.map(member => {
                return {
                    member: member.login
                }
            })
        })
    }

    get octokit() {
        return this._octokit;
    }
}