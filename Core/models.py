from django.db import models

class Cliente(models.Model):
    nome = models.CharField(max_length=100)
    cpf = models.CharField(max_length=14, unique=True)
    email = models.EmailField()
    telefone = models.CharField(max_length=15)
    endereco = models.TextField()
    data_nascimento = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"


class Equipamento(models.Model):
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('alugado', 'Alugado'),
        ('manutencao', 'Em Manutenção'),
        ('indisponivel', 'Indisponível'),
    ]
    
    nome = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disponivel')
    valor_diario = models.DecimalField(max_digits=10, decimal_places=2)
    foto = models.ImageField(upload_to='equipamentos/', blank=True, null=True)

    def __str__(self):
        return self.nome

    @property
    def valor_por_hora(self):
        return self.valor_diario / 24

    class Meta:
        verbose_name = "Equipamento"
        verbose_name_plural = "Equipamentos"


class Aluguel(models.Model):
    STATUS_CHOICES = [
        ('aberto', 'Aberto'),
        ('fechado', 'Fechado'),
        ('cancelado', 'Cancelado'),
        ('em_andamento', 'Em Andamento'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='alugueis')
    equipamento = models.ForeignKey(Equipamento, on_delete=models.CASCADE, related_name='alugueis')
    data_inicio = models.DateTimeField()
    data_fim = models.DateTimeField(blank=True, null=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberto')
    observacoes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.cliente.nome} - {self.equipamento.nome} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        if self.data_fim and not self.valor_total:
            horas = (self.data_fim - self.data_inicio).total_seconds() / 3600
            self.valor_total = self.equipamento.valor_por_hora * horas
        super().save(*args, **kwargs)

    @property
    def duracao_horas(self):
        if self.data_fim:
            return (self.data_fim - self.data_inicio).total_seconds() / 3600
        return None

    class Meta:
        verbose_name = "Aluguel"
        verbose_name_plural = "Aluguéis"
        ordering = ['-created_at']
