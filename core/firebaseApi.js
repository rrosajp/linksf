import firebase from 'firebase'

const LOCATIONS     = 'locations'
const ORGANIZATIONS = 'organizations'
const TAXONOMIES    = 'taxonomies'
const PHONES        = 'phones'
const ONCE_VALUE    = 'value'


export function firebaseClient() {
  if (firebase.apps.length == 1) {
    return firebase // Don't initialize more than one client
  }

  const config = {
    apiKey: "AIzaSyCr7KlhsN-On4LrXTKkRdU-Df0s-WCR-TU",
    authDomain: "vivid-inferno-4672.firebaseapp.com",
    databaseURL: "https://vivid-inferno-4672.firebaseio.com",
    storageBucket: "vivid-inferno-4672.appspot.com",
  }

  firebase.initializeApp(config)

  return firebase
}

export function fetchLocations() {
  return firebaseClient()
    .database()
    .ref(LOCATIONS)
    .orderByKey()
    .once(ONCE_VALUE)
    .then(locationsResponse => locationsResponse.val())
}

export function fetchLocation(id) {
  return firebaseClient()
    .database()
    .ref(`${LOCATIONS}/${id}`)
    .once(ONCE_VALUE)
    .then(locationResponse => locationResponse.val())
}

// Fetches an organization with its services. Returns a Promise
export function fetchOrganization(orgId) {
  return firebaseClient()
    .database()
    .ref(ORGANIZATIONS)
    .orderByChild('id')
    .equalTo(orgId)
    .once(ONCE_VALUE)
    .then(orgResponse => {
      const data = orgResponse.val()
      const index = Object.keys(data)[0]
      return orgResponse.val()[index]
    })
}

export function fetchLocations(index = 0) {
  const startIndex = index.toString()
  const endIndex = (index + PAGINATION_VAL).toString()

  return firebase
    .child(LOCATIONS)
    .orderByKey()
    .startAt(startIndex)
    .endAt(endIndex)
    .once(ONCE_VALUE)
    .then(locationsResponse => (locationsResponse.val()))
}

export function fetchLocation(id) {
  return firebase
    .child(`${LOCATIONS}/${id}`)
    .once(ONCE_VALUE)
    .then(locationResponse => (locationResponse.val()))
}

// Fetchs all available categories
export function fetchTaxonomies() {
  return firebaseClient()
    .database()
    .ref(TAXONOMIES)
    .once(ONCE_VALUE)
    .then(res => res.val())
}
