
// ##########################################################################################################################

// Import Axios
import axios from 'axios'
import type { AxiosResponse } from 'axios'

// Import Misc Modules
import { sets, handles } from 'ts-misc'
import type { SafeReturn } from 'ts-misc/dist/modules/handles'

// Import Modules
import type { ITarget } from './types'

// ##########################################################################################################################

// API Class
export default class Remote {
  // GET  Request
  async get(
    target: ITarget,
    name: string,
    data: Record<string, string | number>
  ): Promise<SafeReturn<AxiosResponse<any>>> {
    return handles.safe(axios.get).async(
      `${target.address}/${name}`,
      {
        params: sets.serialize(data),
        auth: {
          username: target.user,
          password: target.password
        }
      }
    )
  }

  // ##########################################################################################################################

  // POST  Request
  async post(
    target: ITarget,
    name: string,
    data: unknown
  ): Promise<SafeReturn<AxiosResponse<any>>> {
    return handles.safe(axios.post).async(
      `${target.address}/${name}`,
      sets.serialize(data),
      {
        auth: {
          username: target.user,
          password: target.password
        }
      }
    )
  }
}

// ##########################################################################################################################
