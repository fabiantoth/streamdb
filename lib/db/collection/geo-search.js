const setQueryParams = require('../helpers/set-query-params')

const geoSearch = (data, params, geoParams) => {
    if (!Object.prototype.toString.call(geoParams) == '[object Object]' || !geoParams.lat || !geoParams.long || !geoParams.radius) {
        throw new Error('Geo search object must include radius and lat,long coordinates')
    }

    let results = data.filter(place => {
        let distance = getDistance(geoParams.lat, geoParams.long, place.coordinates.latitude, place.coordinates.longitude)
        if ( distance <= geoParams.radius) {
            place['distance'] = distance
            return place
        }
    })

    if (params.length > 0) {
        results = setQueryParams(results, params)
    }

    return results
}

const getDistance = (lat1, long1, lat2, long2) => {
    const p = Math.PI / 180
    const c = Math.cos 
    const a = 0.5 - c((lat2 - lat1) * p)/2 +
              c(lat1 * p) * c(lat2 * p) *
              (1 - c((long2 - long1) * p))/2

    return 12742 * Math.asin(Math.sqrt(a)) * 1000 
}

module.exports = geoSearch