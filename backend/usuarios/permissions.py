from rest_framework import permissions

class IsAdminGeneral(permissions.BasePermission):
    """
    Permite el acceso solo a usuarios con el rol 'admin_general'.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            return request.user.perfil.rol == 'admin_general'
        except AttributeError:
            return False

class IsLectorGastosReadOnly(permissions.BasePermission):
    """
    Si el usuario es 'lector_gastos', solo permite métodos seguros (GET, HEAD, OPTIONS).
    De lo contrario, permite el acceso (dejando que otras clases validen).
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            try:
                if request.user.perfil.rol == 'lector_gastos':
                    return request.method in permissions.SAFE_METHODS
            except AttributeError:
                pass
            
        return True
