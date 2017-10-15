import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Grid from 'material-ui/Grid';
import L from 'leaflet';
L.Control.SideBySide= require('leaflet-side-by-side');
L.control.sideBySide = function (leftLayers, rightLayers, options) {
  return new L.Control.SideBySide(leftLayers, rightLayers, options)
}

/*
  Reference:
    https://material-ui-1dab0.firebaseapp.com/layout/basics/

*/
class App extends Component {
  constructor(props) {
    const { t } = props;
    super(props);
    this.state = {
      mapInitialized: false,
      terravionUserId: 'wildfire@terravion.com',
      terravionAccessToken: '88ca289f-dd42-422e-8e82-266552a11aaf',
      leftMapId:'terravionRGB',
      rightMapId:'terravionThermal',
    }
  }
  
  getTerrAvionLayer(epochTime, product){
    var tileLayerUrl = `https://api.terravion.com/v1/users/${this.state.terravionUserId}/layers/tiles/{z}/{x}/{y}.png?`;
    tileLayerUrl += `epochStart=${epochTime-24*60*60}&epochEnd=${epochTime+24*60*60}`
    if (product == 'RGB'){
      tileLayerUrl += '&product=NC'
    } else {
      tileLayerUrl += '&product=TIRS&colorMap=T'
    }
    tileLayerUrl += `&access_token=${this.state.terravionAccessToken}`
    var terravionLayer=L.tileLayer(tileLayerUrl, {
      attribution: 'TerrAvion',
      maxZoom: 19,
      tms: true
    })
    return terravionLayer
  }
  componentDidMount(){
    this.initMap()
  }
  initMap(){
    var terrAvionEpoch=1507843944 // 10/12/2017
    var mymap = L.map('map', { zoomControl:false }).setView([38.275392, -122.192840], 18);
    var layerInfoDic = {};
    var mapbox_Layer= L.tileLayer("https://api.tiles.mapbox.com/v2/cgwright.ca5740e5/{z}/{x}/{y}.jpg",{
        drawControl: false,
        maxZoom: 22,
        maxNativeZoom: 19
    }).addTo(mymap);
    layerInfoDic.terravionRGB = {id: 'terravionRGB', name:'TerrAvion Color 10/12/2017', layer: this.getTerrAvionLayer(terrAvionEpoch, 'RGB')};
    layerInfoDic.terravionThermal = {id: 'terravionThermal', name:'TerrAvion Thermal 10/12/2017', layer: this.getTerrAvionLayer(terrAvionEpoch, 'Thermal')};
    // Napa Planet 80cm
    // Santa Rosa Planet 3m
    var planetSantaRosaRGBLayer=L.tileLayer('http://ec2-52-34-205-209.us-west-2.compute.amazonaws.com:8080/tiles/planet/SantaRosa_20171013_1036_rgb/{z}/{x}/{y}.png', {
        attribution: 'Planet',
        maxZoom: 16,
        tms: true
    })
    layerInfoDic.planetSantaRosa = {id: 'planetSantaRosa', name:'Planet Santa Rosa 10/13/2017', layer: planetSantaRosaRGBLayer};

    var planetNapaRGBLayer=L.tileLayer('http://ec2-52-34-205-209.us-west-2.compute.amazonaws.com:8080/tiles/planet/napa_s01_20171010T194945_rgb_geo/{z}/{x}/{y}.png', {
        attribution: 'Planet',
        maxZoom: 18,
        tms: true
    })
    layerInfoDic.planetNapa = {id: 'planetNapa', name:'Planet Napa 10/10/2017', layer: planetNapaRGBLayer};
    
    var dgLayer=L.tileLayer('http://ec2-52-34-205-209.us-west-2.compute.amazonaws.com:8080/tiles/dg/post-event/2017-10-11/0221210/{z}/{x}/{y}.png', {
        attribution: 'Digital Globe 50cm',
        maxZoom: 19,
        tms: true
    })
    layerInfoDic.dg = {id: 'dg', name:'Digital Globe 10/11/2017', layer: dgLayer};
    layerInfoDic.terravionRGB.layer.addTo(mymap);
    layerInfoDic.terravionThermal.layer.addTo(mymap);
    var sideBySideContol = L.control.sideBySide(layerInfoDic.terravionRGB.layer, layerInfoDic.terravionThermal.layer).addTo(mymap);
    this.setState({
      mymap,
      layerInfoDic,
      sideBySideContol,
      mapInitialized:true
    })
  }

  zoomMap(lat, lng, zoom){
    console.log('zoom')
    this.state.mymap.setView([lat, lng], zoom)
  }
  updateSideLayer(selectedLayerKey,sideKey){
    var newState = this.state;
    var {layerInfoDic} = this.state;
    var _this = this;
    Object.keys(layerInfoDic).map((layerKey, index)=>{
      if(_this.state.mymap.hasLayer(layerInfoDic[layerKey].layer)){
        _this.state.mymap.removeLayer(layerInfoDic[layerKey].layer)
      }
    })
    newState[`${sideKey}MapId`] = selectedLayerKey
    console.log('newState',newState)
    if (newState.leftMapId != newState.rightMapId){
      layerInfoDic[newState.leftMapId].layer.addTo(this.state.mymap);      
    }
    layerInfoDic[newState.rightMapId].layer.addTo(this.state.mymap);

    this.state.sideBySideContol.setLeftLayers(layerInfoDic[newState.leftMapId].layer);
    this.state.sideBySideContol.setRightLayers(layerInfoDic[newState.rightMapId].layer);
    
    this.setState(newState)
  }
  getLayerList(sideKey){
    var {layerInfoDic} = this.state;
    var selectedStyle = {
      border:'solid',
      borderWidth:'2px'
    }
    var _this = this;
    var layerListDiv = Object.keys(layerInfoDic).map((layerKey, index)=>{
      var style;
      if(_this.state[`${sideKey}MapId`] == layerKey){
        style=selectedStyle
      }
      return (
        <div key={index}
          style={style}
          onClick={this.updateSideLayer.bind(this,layerKey,sideKey)}
        >
          {layerInfoDic[layerKey].name}
        </div>
      )
    })
    return layerListDiv
  }
  getLocationButtons(){
    var locationInfoList = [];
    locationInfoList.push({
      lat:38.489611,
      lng:-122.698126,
      zoom:13,
      name:'Santa Rosa'
    })
    locationInfoList.push({
      lat:38.273215,
      lng:-122.200879,
      zoom:13,
      name:'Napa'
    })
    return locationInfoList.map((locationInfo, index)=>{
      return(
        <Grid item xs={2} key={index}
          onClick={this.zoomMap.bind(this,locationInfo.lat, locationInfo.lng, locationInfo.zoom)}
        >
          {locationInfo.name}
        </Grid>
      )
    })
  }
  render() {
    var locationButtons = this.getLocationButtons();
    var leftGrid;
    var rightGrid;
    if(this.state.mapInitialized){
      var leftLayerDivs = this.getLayerList('left');
      var rightLayerDivs = this.getLayerList('right');
      
      leftGrid = (
        <Grid item xs={2}>
          {leftLayerDivs}
        </Grid>
      )
      rightGrid = (
        <Grid item xs={2}>
          {rightLayerDivs}
        </Grid>    
      )
    };
    return (
      <div>
        <Grid container spacing={0}>
          <Grid item xs={2}>
            Locations:
          </Grid>
          {locationButtons}
        </Grid>
        <Grid container spacing={0}  style={{height:'80%', minHeight:'700px'}}>
          {leftGrid}
          <Grid item xs={8}>
            <div style={{height:'100%',width:'100%'}} id='map'></div>
          </Grid>
          {rightGrid}
        </Grid>
      </div>
    );
  }
}

export default App;
