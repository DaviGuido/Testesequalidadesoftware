const { assert } = require('chai');

describe('P11 - Falha controlada do CI', () => {
  it('deve falhar intencionalmente para demonstrar o bloqueio do pipeline', () => {
    assert.fail('Falha controlada do P11: demonstração do CI');
  });
});