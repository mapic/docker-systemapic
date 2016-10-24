![Mapic Logo](https://cloud.githubusercontent.com/assets/2197944/19607635/5c434458-97cb-11e6-941b-e74e83b385ba.png)
# Mapic

Mapic consists of:   
1. [Mapic Engine](https://github.com/mapic/engine)  
2. [Mapic Tileserver](https://github.com/mapic/mile)    
3. [Mapic Client library](https://github.com/mapic/mapic.js)    
4. [Mapic SDK](https://github.com/mapic/sdk) (for interacting with API programatically)

For a techincal overview, please see [Mapic Technical Overview](https://github.com/mapic/mapic/wiki/Mapic-Techincal-Overview).

Mapic is built on Docker. Docker Images are available on the [Docker Hub](https://hub.docker.com/u/mapic/dashboard/).


## Install
Clone repository and run install:
```bash
git clone git@github.com:mapic/mapic.git
cd mapic
./install-to-localhost.sh
```

#### Install to custom domain
Run normal install above, then see https://github.com/mapic/config-domain.example.com for instructions on changing configs for custom domain.


## Usage
1. Install (see above).
2. `cd mapic/compose/` and run `./restart.sh`. 
3. Open your browser @ https://localhost.



## Depends
Minimum required `Docker` version: 1.9.0 (due to `--build-arg`)  
Recommended `Docker Compose` version: 1.5.2  

## Licence
Mapic is built entirely open source. We believe in a collaborative environment for creating strong solutions for an industry that is constantly moving. The Mapic platform is open for anyone to use and contribute to, which makes it an ideal platform for government organisations as well as NGO's and for-profit businesses.

Mapic is licenced under the [GPLv3 licence](https://github.com/mapic/mapic/blob/master/LICENCE.md)