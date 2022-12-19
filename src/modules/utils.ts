
// ##########################################################################################################################

// Get Contact Number by Name
export const getContactByName = (
  contacts: Record<string, string>,
  target: string,
  invert: boolean = false
): string => {
  // Switch Key-Value Pairs
  if (invert) {
    contacts = Object.entries(contacts)
      .reduce((ret, entry) => {
        const [key, value] = entry
        ret[value] = key
        return ret
      }, {})
  }
  // replace cyclicaly
  while (Object.keys(contacts).includes(target)) {
    target = contacts[target]
  }
  // return result
  return target
}

// ##########################################################################################################################
