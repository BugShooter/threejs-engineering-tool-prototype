(function() {
  const tool = window.EngineeringTool;

  tool.catalog.defaultCatalogData = {
    catalogId: 'default-20mm-v1',
    partTypes: [
      {
        typeId: 'profile-20x20',
        category: 'profile',
        label: 'Профиль 20x20',
        params: {
          length: { type: 'number', min: 40, max: 800, step: 5, default: 200 }
        },
        geometry: {
          kind: 'profile',
          width: 20,
          height: 20
        },
        ports: [
          {
            portId: 'endA',
            kind: 'fixed',
            localPosition: { x: { fromParam: 'length', factor: -0.5 }, y: 0, z: 0 },
            localNormal: [-1, 0, 0],
            localUp: [0, 1, 0],
            contact: { shape: 'rect', width: 20, height: 20 },
            tags: ['profile-end', 'slot-20'],
            capacity: 1,
            snapVisible: true,
            snapSource: true,
            highlightable: true
          },
          {
            portId: 'endB',
            kind: 'fixed',
            localPosition: { x: { fromParam: 'length', factor: 0.5 }, y: 0, z: 0 },
            localNormal: [1, 0, 0],
            localUp: [0, 1, 0],
            contact: { shape: 'rect', width: 20, height: 20 },
            tags: ['profile-end', 'slot-20'],
            capacity: 1,
            snapVisible: true,
            snapSource: true,
            highlightable: true
          },
          {
            portId: 'sideTop',
            kind: 'track',
            localPosition: { x: 0, y: 10, z: 0 },
            localNormal: [0, 1, 0],
            localUp: [0, 0, 1],
            slideAxis: [1, 0, 0],
            slideRange: { fromParam: 'length', factor: 0.5 },
            contact: {
              shape: 'rect',
              width: { fromParam: 'length', factor: 1 },
              height: 20
            },
            tags: ['profile-side-track', 'slot-20'],
            capacity: 999,
            snapVisible: false,
            snapSource: false,
            highlightable: true
          },
          {
            portId: 'sideBottom',
            kind: 'track',
            localPosition: { x: 0, y: -10, z: 0 },
            localNormal: [0, -1, 0],
            localUp: [0, 0, 1],
            slideAxis: [1, 0, 0],
            slideRange: { fromParam: 'length', factor: 0.5 },
            contact: {
              shape: 'rect',
              width: { fromParam: 'length', factor: 1 },
              height: 20
            },
            tags: ['profile-side-track', 'slot-20'],
            capacity: 999,
            snapVisible: false,
            snapSource: false,
            highlightable: true
          },
          {
            portId: 'sideFront',
            kind: 'track',
            localPosition: { x: 0, y: 0, z: 10 },
            localNormal: [0, 0, 1],
            localUp: [0, 1, 0],
            slideAxis: [1, 0, 0],
            slideRange: { fromParam: 'length', factor: 0.5 },
            contact: {
              shape: 'rect',
              width: { fromParam: 'length', factor: 1 },
              height: 20
            },
            tags: ['profile-side-track', 'slot-20'],
            capacity: 999,
            snapVisible: false,
            snapSource: false,
            highlightable: true
          },
          {
            portId: 'sideBack',
            kind: 'track',
            localPosition: { x: 0, y: 0, z: -10 },
            localNormal: [0, 0, -1],
            localUp: [0, 1, 0],
            slideAxis: [1, 0, 0],
            slideRange: { fromParam: 'length', factor: 0.5 },
            contact: {
              shape: 'rect',
              width: { fromParam: 'length', factor: 1 },
              height: 20
            },
            tags: ['profile-side-track', 'slot-20'],
            capacity: 999,
            snapVisible: false,
            snapSource: false,
            highlightable: true
          }
        ],
        render: {
          baseColor: 0x1a4fd6,
          edgeColor: 0x4477ff,
          selectedColor: 0x22ff88,
          selectedEdgeColor: 0x44ffaa,
          emissiveColor: 0x003311,
          ghostColor: 0x22ff88
        }
      },
      {
        typeId: 'connector-straight-20',
        category: 'connector',
        label: 'Соед. прямой',
        geometry: {
          kind: 'straight-connector',
          bodyLength: 36.4,
          width: 20,
          height: 20,
          socketOffset: 13
        },
        ports: [
          {
            portId: 'socketA',
            kind: 'fixed',
            localPosition: { x: -13, y: 0, z: 0 },
            localNormal: [-1, 0, 0],
            localUp: [0, 1, 0],
            contact: { shape: 'rect', width: 20, height: 20 },
            tags: ['connector-socket', 'slot-20'],
            capacity: 1,
            snapVisible: true,
            snapSource: true,
            highlightable: true
          },
          {
            portId: 'socketB',
            kind: 'fixed',
            localPosition: { x: 13, y: 0, z: 0 },
            localNormal: [1, 0, 0],
            localUp: [0, 1, 0],
            contact: { shape: 'rect', width: 20, height: 20 },
            tags: ['connector-socket', 'slot-20'],
            capacity: 1,
            snapVisible: true,
            snapSource: true,
            highlightable: true
          }
        ],
        render: {
          baseColor: 0xaa1177,
          edgeColor: 0xff66cc,
          selectedColor: 0x22ff88,
          selectedEdgeColor: 0x44ffaa,
          emissiveColor: 0x003311,
          ghostColor: 0x22ff88
        }
      },
      {
        typeId: 'connector-angle-20',
        category: 'connector',
        label: 'Соед. угловой',
        geometry: {
          kind: 'angle-connector',
          armLength: 26,
          thickness: 17,
          socketOffset: 13,
          bodyOffset: 7.8
        },
        ports: [
          {
            portId: 'socketX',
            kind: 'fixed',
            localPosition: { x: 13, y: 0, z: 0 },
            localNormal: [1, 0, 0],
            localUp: [0, 1, 0],
            contact: { shape: 'rect', width: 20, height: 20 },
            tags: ['connector-socket', 'slot-20'],
            capacity: 1,
            snapVisible: true,
            snapSource: true,
            highlightable: true
          },
          {
            portId: 'socketZ',
            kind: 'fixed',
            localPosition: { x: 0, y: 0, z: 13 },
            localNormal: [0, 0, 1],
            localUp: [0, 1, 0],
            contact: { shape: 'rect', width: 20, height: 20 },
            tags: ['connector-socket', 'slot-20'],
            capacity: 1,
            snapVisible: true,
            snapSource: true,
            highlightable: true
          }
        ],
        render: {
          baseColor: 0xcc5500,
          edgeColor: 0xffaa44,
          selectedColor: 0x22ff88,
          selectedEdgeColor: 0x44ffaa,
          emissiveColor: 0x003311,
          ghostColor: 0x22ff88
        }
      }
    ],
    connectionRules: [
      {
        ruleId: 'profile-end-to-profile-end-20',
        aTags: ['profile-end', 'slot-20'],
        bTags: ['profile-end', 'slot-20'],
        bidirectional: true,
        connectionMode: 'fixed-to-fixed',
        constraints: {
          normalMode: 'opposite',
          rollStepDeg: 90,
          maxGap: 50,
          requireContactFit: true
        }
      },
      {
        ruleId: 'profile-end-to-connector-socket-20',
        aTags: ['profile-end', 'slot-20'],
        bTags: ['connector-socket', 'slot-20'],
        bidirectional: true,
        connectionMode: 'fixed-to-fixed',
        constraints: {
          normalMode: 'opposite',
          rollStepDeg: 90,
          maxGap: 50,
          requireContactFit: true
        }
      },
      {
        ruleId: 'connector-socket-to-connector-socket-20',
        aTags: ['connector-socket', 'slot-20'],
        bTags: ['connector-socket', 'slot-20'],
        bidirectional: true,
        connectionMode: 'fixed-to-fixed',
        constraints: {
          normalMode: 'opposite',
          rollStepDeg: 90,
          maxGap: 50,
          requireContactFit: true
        }
      },
      {
        ruleId: 'profile-end-to-profile-track-20',
        aTags: ['profile-end', 'slot-20'],
        bTags: ['profile-side-track', 'slot-20'],
        bidirectional: true,
        connectionMode: 'fixed-to-track',
        constraints: {
          normalMode: 'opposite',
          rollStepDeg: 90,
          maxGap: 50,
          requireContactFit: true
        }
      },
      {
        ruleId: 'connector-socket-to-profile-track-20',
        aTags: ['connector-socket', 'slot-20'],
        bTags: ['profile-side-track', 'slot-20'],
        bidirectional: true,
        connectionMode: 'fixed-to-track',
        constraints: {
          normalMode: 'opposite',
          rollStepDeg: 90,
          maxGap: 50,
          requireContactFit: true
        }
      }
    ]
  };
})();