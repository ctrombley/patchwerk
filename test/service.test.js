const { fork } = require('child_process');
const fetch = require('node-fetch');

function eventPromiseBuilder(obj, event) {
  return new Promise((resolve) => {
    obj.on(event, () => { resolve(); });
  });
}

describe('service', () => {
  beforeAll(async (done) => {
    this.layoutService = fork('./test/services/layout-app/index.js');
    this.componentService = fork('./test/services/component-app/index.js');
    this.patchwerkService = fork('./index.js');

    const layoutServiceStarted = eventPromiseBuilder(this.layoutService, 'message');
    const componentServiceStarted = eventPromiseBuilder(this.componentService, 'message');
    const patchwerkServiceStarted = eventPromiseBuilder(this.patchwerkService, 'message');

    await Promise.race([
      layoutServiceStarted,
      componentServiceStarted,
      patchwerkServiceStarted,
    ]);

    done();
  });

  afterAll(() => {
    this.layoutService.kill('SIGINT');
    this.componentService.kill('SIGINT');
    this.patchwerkService.kill('SIGINT');
  });

  it('should work', (done) => {
    fetch('http://localhost:8000')
      .then((res) => {
        expect(res.ok).toBeTruthy();
        return res.text();
      })
      .then((body) => {
        expect(body).not.toBeNull();
        done();
      });
  });
});
