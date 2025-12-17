/**
 * Controller: devuelve el usuario autenticado (decoded token)
 * Sirve para probar que firebaseAuth está funcionando
 */
function me(req, res) {
  return res.json({
    ok: true,
    user: {
      uid: req.user.uid,
      email: req.user.email,
      claims: req.user,
    },
  });
}

module.exports = { me };