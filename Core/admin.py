from django.contrib import admin
from .models import Cliente, Equipamento, Aluguel

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cpf', 'email', 'telefone', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['nome', 'cpf', 'email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'status', 'valor_diario']
    list_filter = ['status']
    search_fields = ['nome']

@admin.register(Aluguel)
class AluguelAdmin(admin.ModelAdmin):
    list_display = ['cliente', 'equipamento', 'data_inicio', 'data_fim', 'status', 'valor_total']
    list_filter = ['status', 'created_at', 'data_inicio']
    search_fields = ['cliente__nome', 'equipamento__nome']
    readonly_fields = ['created_at', 'updated_at', 'duracao_horas']
    autocomplete_fields = ['cliente', 'equipamento']
    
    fieldsets = (
        ('Informações Principais', {
            'fields': ('cliente', 'equipamento', 'status')
        }),
        ('Datas', {
            'fields': ('data_inicio', 'data_fim', 'duracao_horas')
        }),
        ('Valores', {
            'fields': ('valor_total',)
        }),
        ('Observações', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
