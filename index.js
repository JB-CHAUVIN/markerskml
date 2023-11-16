const fs = require('fs');
const xml2js = require('xml2js');
const turf = require('@turf/turf');
const moment = require('moment');

// Fonction pour ajouter des marqueurs tous les 1 km dans un fichier GPX
async function addMarkersEveryKmGpx(gpxFile) {
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();

    // Lire le fichier GPX
    const gpx = await fs.promises.readFile(gpxFile, 'utf8');
    const result = await parser.parseStringPromise(gpx);

    // Supposons que le chemin est dans result.gpx.trk[0].trkseg[0].trkpt
    const trackPoints = result.gpx.trk[0].trkseg[0].trkpt;
    const points = trackPoints.map(pt => turf.point([parseFloat(pt.$.lon), parseFloat(pt.$.lat)]));
    const line = turf.lineString(points.map(point => point.geometry.coordinates));

    // Ajouter des waypoints tous les 1 km
    // set date to to 19/11/2024 9h45 (French time)
    const length = turf.length(line, { units: 'kilometers' });

    let limitStart = 21;
    let limitStop = 42;

    let raceStart = moment().year(2024).month(10).date(19).hour(9).minute(45).second(0);
    raceStart.add(3 * limitStart, 'minutes').add(47 * limitStart, 'seconds');
    let date = raceStart;

    for (let i = 1; i <= length; i++) {
        date = date.clone().add('3', 'minutes').add('47', 'seconds');

        const point = turf.along(line, i, { units: 'kilometers' });
        const waypoint = {
            wpt: {
                $: {
                    lat: point.geometry.coordinates[1].toString(),
                    lon: point.geometry.coordinates[0].toString()
                },
                name: [`Km ${i} - ${date.format('HH:mm:ss')} - ${moment(raceStart).clone().diff(date, 'minutes')}`], // Personnalisation du label ici
                // Vous pouvez ajouter d'autres balises personnalisées si nécessaire
            }
        };
        if (!result.gpx.wpt) {
            result.gpx.wpt = [];
        }

        if(i > limitStart && i <= limitStop) {
            result.gpx.wpt.push(waypoint);
        }
    }

    // Sauvegarder le fichier GPX modifié
    const newGpx = builder.buildObject(result);
    await fs.promises.writeFile('updated.gpx', newGpx);
}

// Utiliser la fonction avec un fichier GPX
addMarkersEveryKmGpx('original.gpx')
    .then(() => console.log('Markers added successfully'))
    .catch(err => console.error(err));
