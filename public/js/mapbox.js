/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicGVuYW1hbmsiLCJhIjoiY2wyZ3ExZzI1MDQwbDNjbjcxcm01ZXh6ayJ9.cMQSgTHYlnO7qVvhV8JZgw';
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/penamank/cl2grrnos000t14pmsrw5hx3j', // style URL
    scrollZoom: false,
    center: [-84.4010024, 39.0998549], // starting position [lng, lat]
    zoom: 100, // starting zoom
    interactive: true,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker to mapbox map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend the map view to include the location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
