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
