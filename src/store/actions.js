/* This file is part of the BIMData Platform package.
(c) BIMData support@bimdata.io
For the full copyright and license information, please view the LICENSE
file that was distributed with this source code. */
import { UserRepository } from '@/api/UserRepository'
import { CloudRepository } from '@/api/CloudRepository'
import { ProjectRepository } from '@/api/ProjectRepository'
import { generateClient } from '@/api/initClient'
import _ from 'lodash'

export default {
  async init ({commit, getters, dispatch}) {
    let defaultClient = generateClient(getters.oidcAccessToken)
    this.UserRepositoryRequest = new UserRepository(defaultClient)
    this.CloudRepositoryRequest = new CloudRepository(defaultClient)
    this.ProjectRepositoryRequest = new ProjectRepository(defaultClient)
  },
  async fetchUserData ({commit}) {
    try {
      const response = await this.UserRepositoryRequest.getSelfUserData()
      commit('SET_USER_DATA', response)
      return response
    } catch (e) {
      console.log(e)
    }
  },
  async fetchUserCloudsDetails ({commit, dispatch, state}) {
    try {
      const clouds = await this.CloudRepositoryRequest.getSelfUserClouds()
      let methods = []

      clouds.forEach((cloud) => {
        const role = _.find(state.currentUser.clouds, ['cloud', cloud.id])
        cloud.role = role ? role.role : null
        let nbUserRetrieve = async function () {
          let users = await dispatch('getCloudUsers', cloud.id)
          cloud.users = users
        }
        let projectsRetrieve = async function () {
          let projects = await dispatch('getProjects', cloud.id)
          projects.forEach((project) => {
            const role = _.find(state.currentUser.projects, ['project', project.id])
            project.role = role ? role.role : null
          })
          cloud.projects = projects
        }

        methods.push(nbUserRetrieve())
        methods.push(projectsRetrieve())
      })
      await Promise.all(methods)

      commit('SET_USER_CLOUDS', clouds)
      return clouds
    } catch (e) {
      console.error(e)
    }
  },
  async removeProject (context, project) {
    try {
      await this.ProjectRepositoryRequest.deleteProject(context.state.currentCloud.id, project)
      await this.dispatch('fetchUserData')
      context.commit('DELETE_PROJECT', project)
      return true
    } catch (e) {
      console.log(e)
    }
  },
  async addProject (context, projectName) {
    try {
      const newProject = await this.ProjectRepositoryRequest.createNewProject(context.state.currentCloud.id, projectName)
      await this.dispatch('fetchUserData')
      const role = _.find(context.state.currentUser.projects, ['project', newProject.id])
      newProject.role = role ? role.role : null
      context.commit('ADD_PROJECT', newProject)
      return newProject
    } catch (e) {
      console.log(e)
    }
  },
  async updateProject (context, project) {
    try {
      await this.ProjectRepositoryRequest.updateProject(context.state.currentCloud.id, project)
      context.commit('UPDATE_USER_PROJECT', project)
      return project
    } catch (e) {
      console.log(e)
    }
  },
  async removeCloud (context, cloudId) {
    try {
      await this.CloudRepositoryRequest.deleteCloud(cloudId)
      await this.dispatch('fetchUserData')
      await this.dispatch('fetchUserCloudsDetails')
      return true
    } catch (e) {
      console.log(e)
    }
  },
  async addCloud (context, projectName) {
    try {
      const newCloud = await this.CloudRepositoryRequest.createNewCloud(projectName)
      await this.dispatch('fetchUserData')
      await this.dispatch('fetchUserCloudsDetails')
      return newCloud
    } catch (e) {
      console.log(e)
    }
  },
  async updateCloud (context, cloud) {
    try {
      await this.CloudRepositoryRequest.updateCloud(cloud)
      context.commit('UPDATE_USER_CLOUD', cloud)
      return cloud
    } catch (e) {
      console.log(e)
    }
  },
  async getCloudUsers (context, idCloud) {
    try {
      let result = await this.CloudRepositoryRequest.getCloudUsers(idCloud)
      return result
    } catch (e) {
      console.log(e)
    }
  },
  async getProjects (context, idCloud) {
    try {
      let result = await this.ProjectRepositoryRequest.getProjects(idCloud)
      return result
    } catch (e) {
      console.log(e)
    }
  },
  setLang ({commit}, payload) {
    commit('SET_LANG', payload)
  },
  async updateCloudName ({commit}, {id, name}) {
    try {
      await this.CloudRepositoryRequest.updateCloud({id, name})
      await this.dispatch('fetchUserCloudsDetails')
      return true
    } catch (e) {
      console.log(e)
    }
  },
  async deleteCloudUser ({state, commit}, {cloudId, userId}) {
    try {
      await this.CloudRepositoryRequest.deleteCloudUser(cloudId, userId)
      await this.dispatch('fetchUserCloudsDetails')
      let cloud = state.clouds.find(cloud => parseInt(cloud.id) === parseInt(cloudId))
      commit('SET_CURRENT_CLOUD', cloud)
      return true
    } catch (e) {
      console.log(e)
    }
  },
  async deleteCloudUserPending ({state, commit}, {cloudId, invitationId}) {
    try {
      await this.CloudRepositoryRequest.deleteCloudUserPending(cloudId, invitationId)
      return true
    } catch (e) {
      console.log(e)
    }
  },
  inviteCloudUser (context, params) {
    try {
      return this.CloudRepositoryRequest.inviteUser(params.cloudId, params.invite)
    } catch (e) {
      console.log(e)
    }
  },
  async updateCloudUser (context, params) {
    try {
      await this.CloudRepositoryRequest.updateUser(params)
      await this.dispatch('fetchUserCloudsDetails')
      return true
    } catch (e) {
      console.log(e)
    }
  },
  async getCloudGuests ({ commit }, cloudPk) {
    try {
      let guests = await this.CloudRepositoryRequest.getCloudInvitations(cloudPk)
      commit('SET_CURRENT_CLOUD_GUESTS', guests)
      return guests
    } catch (e) {
      console.log(e)
    }
  },
  async getIfcViewerFile ({ commit, state }, {cloudPk, projectPk, id}) {
    let result = await this.IFCRepositoryRequest.getIfc(cloudPk, id, projectPk)
    if (result.viewer_360_file) {
      let ifcs = state.project.ifcs
      let ifc = _.find(ifcs, {id: result.id})
      ifc.viewer_360_file = result.viewer_360_file
      commit('project/SET_IFCS', ifcs)
      return result
    }
  }
}
