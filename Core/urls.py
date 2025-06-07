from django.urls import path, include, re_path
from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path('logout/', views.logout_view, name="logout"),
    path('clientes/', views.index, name="clientes"),
    path('equipamentos/', views.index, name="equipamentos"),
    path('alugueis/', views.index, name="alugueis"),
    path('api/clientes/', views.clientes_api, name="clientes_api"),
    path('api/clientes/<int:cliente_id>/', views.cliente_detail_api, name="cliente_detail_api"),
    path('api/equipamentos/', views.equipamentos_api, name="equipamentos_api"),
    path('api/equipamentos/<int:equipamento_id>/', views.equipamento_detail_api, name="equipamento_detail_api"),
    path('api/alugueis/', views.alugueis_api, name="alugueis_api"),
    path('api/alugueis/<int:aluguel_id>/', views.aluguel_detail_api, name="aluguel_detail_api"),
    path('api/alugueis/<int:aluguel_id>/close/', views.close_aluguel_api, name="close_aluguel_api"),
    path('api/alugueis/check-expired/', views.check_expired_rentals_api, name="check_expired_rentals_api"),
    path('api/dashboard/stats/', views.dashboard_stats_api, name="dashboard_stats_api"),
    re_path(r'^media/(?P<path>.*)$', views.protected_media, name='protected_media'),
]