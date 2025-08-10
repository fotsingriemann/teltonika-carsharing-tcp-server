const {payloadObj, sensorObj, obdObj} = require('./object')

const binaryToDecimal = (binaryString) => {
  return parseInt(binaryString, 2);
}

const createEventFlagString_ = (ignition_bit) => {
  let str = DEFAULT_EVENT_FLAG;
  let eventStringFlag = str.split(",");
  eventStringFlag[10] = ignition_bit;
  eventStringFlag[12] = ignition_bit == "1" ? "0" : "1";
  let event_flag = binaryToDecimal(eventStringFlag.reverse().join(""));
  return event_flag;
};

const extractDateTime = (isoString) => {
  const dateObj = new Date(isoString);
  
  // Vérification de la validité de la date
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date string');
  }

  const date = dateObj.toISOString().split('T')[0];        // Format: YYYY-MM-DD
  const time = dateObj.toISOString().split('T')[1].split('.')[0]; // Format: HH:MM:SS
  const timestamp = dateObj.getTime()/1000;                    // Timestamp en millisecondes

  return { 
    date, 
    time,
    timestamp 
  };
}

const  gpsStatus_interpret = (gpsStatus) => {
    let status = ''
    if(gpsStatus == 1) status = 'A'
    else if (gpsStatus == 0) status = 'S'

    return status
}

const processData = (data) => {
    
  
    let imei = data.message

        payloadObj.imeiNo = imei
        payloadObj.serialNo = imei
        payloadObj.uniqueId = `it_${imei}`

    let mydatas = data.data

    mydatas.forEach(element => {
        const {date, time, timestamp} = extractDateTime(element.time)
        payloadObj.date = date
        payloadObj.time = time
        payloadObj.timestamp = timestamp
        payloadObj.latitude = element.gps.Latitude
        payloadObj.longitude = element.gps.Longitude
        payloadObj.direction = element.gps.Angle
        payloadObj.altitude = element.gps.Altitude
        payloadObj.satellites = element.gps.Satellites
        payloadObj.speed= element.gps.Speed 
        payloadObj.extBatVol = element.elements['66'] ? element.elements['66'] : 0 // batterie externe
        payloadObj.intBatVol = element.elements['67'] ? element.elements['67'] : 0 // batterie interne
        payloadObj.gpsSignal = element.elements['21'] ? element.elements['21'] : 0 // signal : No signal, GSM (2G), EDGE (2.5G), UMTS (3G), LTE (4G), NR (5G)
        payloadObj.gpsStatus = gpsStatus_interpret(element.elements['69'] ? element.elements['69'] : 0) // le gpsStatus
        payloadObj.PDOP = element.elements['181'] ? element.elements['181'] : 0 // le pdop
        payloadObj.HDOP = element.elements['182'] ? element.elements['182'] : 0 // le hdop
        payloadObj.distance = element.elements['16'] ? element.elements['16'] : 0 // le total odometer
        payloadObj.xval = element.elements['17'] ? element.elements['17'] : 0 // the value of X axis
        payloadObj.yval = element.elements['18'] ? element.elements['18'] : 0 // the value of Y Axis
        payloadObj.zval = element.elements['19'] ? element.elements['19'] : 0 // the value of Z Axis
        payloadObj.analog2 = element.elements['6'] ? element.elements['6'] : 0 // the analog input 2
        payloadObj.latitudeDir = element.gps.Latitude > 0 ? 'N' : 'S'
        payloadObj.longitudeDir = element.gps.Longitude > 0 ? 'E' : 'W'
        let ignition = element.elements['239'] ? element.elements['239'] : 0 // ignition
        payloadObj.event_flag = createEventFlagString_(ignition) // event flag
        payloadObj.fl_level = element.elements['1'] ? element.elements['1'] : 0 // digital input 1
        payloadObj.userId = element.elements['238'] ? element.elements['238'] : 'DEFAULT' // the userid connecter through bleutooth


        // les donnees obd
        obdObj.uniqueId = `it_${imei}`
        obdObj.ts = timestamp
        obdObj.extBatVol = element.elements['66'] ? element.elements['66'] : 0 // batterie externe
        obdObj.intBatVol = element.elements['67'] ? element.elements['67'] : 0 // batterie interne
        obdObj.vehicleSpeed = element.elements['81'] ? element.elements['81'] : 0 // Vitesse odometrique
        obdObj.accelerator_pedal_pos = element.elements['82'] ? element.elements['82'] : 0 // acceleration pedal possition
        obdObj.rpm = element.elements['85'] ? element.elements['85'] : 0 // rpm
        obdObj.odo_distance = element.elements['105'] ? element.elements['105'] : 0 //total milege
        obdObj.event_flag = createEventFlagString_(ignition) // le event flag de l'obd
        obdObj.obdDistance = element.elements['87'] ? element.elements['87'] : 0 // the vehicle distance
        obdObj.fuel_level = element.elements['84'] ? element.elements['84'] : (element.elements['89'] ? element.elements['89']*10000 : 0)

        
        // les donnees de sensor
        sensorObj.uniqueId =`it_${imei}`
        sensorObj.date = date
        sensorObj.time = time
        sensorObj.timestamp = timestamp
        sensorObj.latitude = element.gps.Latitude
        sensorObj.longitude = element.gps.Longitude
        sensorObj.serialNo = imei
        sensorObj.PDOP = element.elements['181'] ? element.elements['181'] : 0
        sensorObj.rfid = element.elements['207'] ? element.elements['207'] : '00'


        console.log(payloadObj)
        console.log(obdObj)
        console.log(sensorObj)
    });

    
}


module.exports = {
    processData
}