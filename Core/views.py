from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse, Http404, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from .models import Cliente, Equipamento, Aluguel
import json
import os
import mimetypes
from datetime import datetime, date
from django.utils import timezone
from decimal import Decimal
from django.conf import settings
from django.db.models import Sum, Count, Q
from django.http import QueryDict

@login_required
@staff_member_required
@never_cache
def index(request):
    return render(request, 'Core/index.html')

def logout_view(request):
    """Custom logout view that handles GET requests"""
    logout(request)
    return redirect('/admin/login/')

@login_required
@staff_member_required
def protected_media(request, path):
    """Serve media files only to authenticated admin users"""
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    if not os.path.exists(file_path):
        raise Http404("File not found")
    
    # Get the content type
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = 'application/octet-stream'
    
    # Return the file
    return FileResponse(
        open(file_path, 'rb'),
        content_type=content_type,
        as_attachment=False
    )

def delete_old_photo(photo_path):
    """Helper function to delete old photo file"""
    if photo_path and os.path.exists(photo_path.path):
        try:
            os.remove(photo_path.path)
        except OSError:
            pass  # Ignore if file doesn't exist or can't be deleted

@csrf_exempt
@require_http_methods(["GET", "POST"])
@login_required
@staff_member_required
def clientes_api(request):
    if request.method == 'GET':
        clientes = Cliente.objects.all().values()
        return JsonResponse(list(clientes), safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
            cliente = Cliente.objects.create(
                nome=data['nome'],
                cpf=data['cpf'],
                email=data['email'],
                telefone=data['telefone'],
                endereco=data['endereco'],
                data_nascimento=data_nascimento
            )
            return JsonResponse({
                'id': cliente.id,
                'nome': cliente.nome,
                'cpf': cliente.cpf,
                'email': cliente.email,
                'telefone': cliente.telefone,
                'endereco': cliente.endereco,
                'data_nascimento': cliente.data_nascimento.isoformat(),
                'created_at': cliente.created_at.isoformat(),
                'updated_at': cliente.updated_at.isoformat()
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
@login_required
@staff_member_required
def cliente_detail_api(request, cliente_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)
    
    if request.method == 'GET':
        return JsonResponse({
            'id': cliente.id,
            'nome': cliente.nome,
            'cpf': cliente.cpf,
            'email': cliente.email,
            'telefone': cliente.telefone,
            'endereco': cliente.endereco,
            'data_nascimento': cliente.data_nascimento.isoformat(),
            'created_at': cliente.created_at.isoformat(),
            'updated_at': cliente.updated_at.isoformat()
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
            cliente.nome = data['nome']
            cliente.cpf = data['cpf']
            cliente.email = data['email']
            cliente.telefone = data['telefone']
            cliente.endereco = data['endereco']
            cliente.data_nascimento = data_nascimento
            cliente.save()
            
            return JsonResponse({
                'id': cliente.id,
                'nome': cliente.nome,
                'cpf': cliente.cpf,
                'email': cliente.email,
                'telefone': cliente.telefone,
                'endereco': cliente.endereco,
                'data_nascimento': cliente.data_nascimento.isoformat(),
                'created_at': cliente.created_at.isoformat(),
                'updated_at': cliente.updated_at.isoformat()
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        cliente.delete()
        return JsonResponse({'message': 'Cliente deletado com sucesso'}, status=204)


@csrf_exempt
@require_http_methods(["GET", "POST"])
@login_required
@staff_member_required
def equipamentos_api(request):
    if request.method == 'GET':
        equipamentos_data = []
        for equipamento in Equipamento.objects.all():
            equipamentos_data.append({
                'id': equipamento.id,
                'nome': equipamento.nome,
                'status': equipamento.status,
                'valor_diario': str(equipamento.valor_diario),
                'valor_por_hora': str(equipamento.valor_por_hora),
                'foto': equipamento.foto.url if equipamento.foto else None
            })
        return JsonResponse(equipamentos_data, safe=False)
    
    elif request.method == 'POST':
        try:
            # Handle multipart form data for file upload
            if request.content_type and 'multipart/form-data' in request.content_type:
                nome = request.POST.get('nome')
                status = request.POST.get('status', 'disponivel')
                valor_diario = request.POST.get('valor_diario')
                foto = request.FILES.get('foto')
                
                equipamento = Equipamento.objects.create(
                    nome=nome,
                    status=status,
                    valor_diario=Decimal(str(valor_diario)),
                    foto=foto
                )
            else:
                # Handle JSON data
                data = json.loads(request.body)
                equipamento = Equipamento.objects.create(
                    nome=data['nome'],
                    status=data.get('status', 'disponivel'),
                    valor_diario=Decimal(str(data['valor_diario']))
                )
            
            return JsonResponse({
                'id': equipamento.id,
                'nome': equipamento.nome,
                'status': equipamento.status,
                'valor_diario': str(equipamento.valor_diario),
                'valor_por_hora': str(equipamento.valor_por_hora),
                'foto': equipamento.foto.url if equipamento.foto else None
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
@login_required
@staff_member_required
def equipamento_detail_api(request, equipamento_id):
    equipamento = get_object_or_404(Equipamento, id=equipamento_id)
    
    if request.method == 'GET':
        return JsonResponse({
            'id': equipamento.id,
            'nome': equipamento.nome,
            'status': equipamento.status,
            'valor_diario': str(equipamento.valor_diario),
            'valor_por_hora': str(equipamento.valor_por_hora),
            'foto': equipamento.foto.url if equipamento.foto else None
        })
    
    elif request.method in ['PUT', 'PATCH']:
        try:
            # Handle multipart form data for PATCH/PUT manually
            if request.content_type and 'multipart/form-data' in request.content_type:
                import re
                
                # Parse multipart data manually since Django doesn't handle it for PATCH/PUT
                body_bytes = request.body
                
                # Find the boundary
                boundary_match = re.search(rb'------WebKitFormBoundary\w+', body_bytes)
                if not boundary_match:
                    raise ValueError("Could not find form boundary")
                
                boundary = boundary_match.group(0)
                
                # Split the body by boundary
                parts = body_bytes.split(boundary)
                
                extracted_data = {}
                uploaded_file = None
                
                for part in parts:
                    if b'Content-Disposition: form-data' in part:
                        # Extract field name
                        name_match = re.search(rb'name="([^"]+)"', part)
                        if name_match:
                            field_name = name_match.group(1).decode('utf-8')
                            
                            # Check if it's a file upload
                            if b'filename=' in part:
                                # Extract file data
                                file_start = part.find(b'\r\n\r\n') + 4
                                file_end = part.rfind(b'\r\n')
                                if file_start < file_end:
                                    file_data = part[file_start:file_end]
                                    filename_match = re.search(rb'filename="([^"]*)"', part)
                                    filename = filename_match.group(1).decode('utf-8') if filename_match else 'uploaded_file'
                                    
                                    # Create a simple file-like object
                                    from django.core.files.uploadedfile import SimpleUploadedFile
                                    uploaded_file = SimpleUploadedFile(filename, file_data)
                            else:
                                # Extract text field value
                                value_start = part.find(b'\r\n\r\n') + 4
                                value_end = part.rfind(b'\r\n')
                                if value_start < value_end:
                                    try:
                                        value = part[value_start:value_end].decode('utf-8')
                                        extracted_data[field_name] = value
                                    except UnicodeDecodeError:
                                        pass  # Skip fields that can't be decoded
                
                # Update equipment fields
                if 'nome' in extracted_data:
                    equipamento.nome = extracted_data['nome']
                if 'status' in extracted_data:
                    equipamento.status = extracted_data['status']
                if 'valor_diario' in extracted_data:
                    equipamento.valor_diario = Decimal(str(extracted_data['valor_diario']))
                
                # Handle file upload
                if uploaded_file:
                    # Delete old photo before saving new one
                    old_photo = equipamento.foto
                    if old_photo:
                        delete_old_photo(old_photo)
                    equipamento.foto = uploaded_file
                
                equipamento.save()
                
            else:
                # Handle JSON data
                data = json.loads(request.body)
                equipamento.nome = data['nome']
                equipamento.status = data.get('status', equipamento.status)
                equipamento.valor_diario = Decimal(str(data['valor_diario']))
                equipamento.save()
            
            return JsonResponse({
                'id': equipamento.id,
                'nome': equipamento.nome,
                'status': equipamento.status,
                'valor_diario': str(equipamento.valor_diario),
                'valor_por_hora': str(equipamento.valor_por_hora),
                'foto': equipamento.foto.url if equipamento.foto else None
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        # Delete photo file before deleting equipment record
        if equipamento.foto:
            delete_old_photo(equipamento.foto)
        
        equipamento.delete()
        return JsonResponse({'message': 'Equipamento deletado com sucesso'}, status=204)


@csrf_exempt
@require_http_methods(["GET", "POST"])
@login_required
@staff_member_required
def alugueis_api(request):
    if request.method == 'GET':
        alugueis_data = []
        for aluguel in Aluguel.objects.select_related('cliente', 'equipamento').all():
            alugueis_data.append({
                'id': aluguel.id,
                'cliente': {
                    'id': aluguel.cliente.id,
                    'nome': aluguel.cliente.nome
                },
                'equipamento': {
                    'id': aluguel.equipamento.id,
                    'nome': aluguel.equipamento.nome
                },
                'data_inicio': aluguel.data_inicio.isoformat(),
                'data_fim': aluguel.data_fim.isoformat() if aluguel.data_fim else None,
                'valor_total': str(aluguel.valor_total) if aluguel.valor_total else None,
                'status': aluguel.status,
                'observacoes': aluguel.observacoes,
                'created_at': aluguel.created_at.isoformat(),
                'updated_at': aluguel.updated_at.isoformat()
            })
        return JsonResponse(alugueis_data, safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            cliente = get_object_or_404(Cliente, id=data['cliente'])
            equipamento = get_object_or_404(Equipamento, id=data['equipamento'])
            
            # Parse dates
            data_inicio = timezone.datetime.fromisoformat(data['data_inicio'].replace('Z', '+00:00'))
            if not timezone.is_aware(data_inicio):
                data_inicio = timezone.make_aware(data_inicio)
            data_fim = None
            if data.get('data_fim'):
                data_fim = timezone.datetime.fromisoformat(data['data_fim'].replace('Z', '+00:00'))
                if not timezone.is_aware(data_fim):
                    data_fim = timezone.make_aware(data_fim)
            
            aluguel = Aluguel.objects.create(
                cliente=cliente,
                equipamento=equipamento,
                data_inicio=data_inicio,
                data_fim=data_fim,
                valor_total=Decimal(str(data['valor_total'])) if data.get('valor_total') else None,
                status=data.get('status', 'aberto'),
                observacoes=data.get('observacoes', '')
            )
            
            # Update equipment status to 'alugado' if rental is active
            if aluguel.status in ['aberto', 'em_andamento']:
                equipamento.status = 'alugado'
                equipamento.save()
            
            return JsonResponse({
                'id': aluguel.id,
                'cliente': {
                    'id': aluguel.cliente.id,
                    'nome': aluguel.cliente.nome
                },
                'equipamento': {
                    'id': aluguel.equipamento.id,
                    'nome': aluguel.equipamento.nome
                },
                'data_inicio': aluguel.data_inicio.isoformat(),
                'data_fim': aluguel.data_fim.isoformat() if aluguel.data_fim else None,
                'valor_total': str(aluguel.valor_total) if aluguel.valor_total else None,
                'status': aluguel.status,
                'observacoes': aluguel.observacoes,
                'created_at': aluguel.created_at.isoformat(),
                'updated_at': aluguel.updated_at.isoformat()
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
@login_required
@staff_member_required
def aluguel_detail_api(request, aluguel_id):
    aluguel = get_object_or_404(Aluguel, id=aluguel_id)
    
    if request.method == 'GET':
        return JsonResponse({
            'id': aluguel.id,
            'cliente': {
                'id': aluguel.cliente.id,
                'nome': aluguel.cliente.nome
            },
            'equipamento': {
                'id': aluguel.equipamento.id,
                'nome': aluguel.equipamento.nome
            },
            'data_inicio': aluguel.data_inicio.isoformat(),
            'data_fim': aluguel.data_fim.isoformat() if aluguel.data_fim else None,
            'valor_total': str(aluguel.valor_total) if aluguel.valor_total else None,
            'status': aluguel.status,
            'observacoes': aluguel.observacoes,
            'created_at': aluguel.created_at.isoformat(),
            'updated_at': aluguel.updated_at.isoformat()
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            # Get new cliente and equipamento if provided
            if 'cliente' in data:
                aluguel.cliente = get_object_or_404(Cliente, id=data['cliente'])
            if 'equipamento' in data:
                old_equipamento = aluguel.equipamento
                aluguel.equipamento = get_object_or_404(Equipamento, id=data['equipamento'])
                
                # Update old equipment status if changed
                if old_equipamento != aluguel.equipamento:
                    old_equipamento.status = 'disponivel'
                    old_equipamento.save()
            
            # Parse dates
            if 'data_inicio' in data:
                data_inicio = timezone.datetime.fromisoformat(data['data_inicio'].replace('Z', '+00:00'))
                if not timezone.is_aware(data_inicio):
                    data_inicio = timezone.make_aware(data_inicio)
                aluguel.data_inicio = data_inicio
            if 'data_fim' in data:
                if data['data_fim']:
                    data_fim = timezone.datetime.fromisoformat(data['data_fim'].replace('Z', '+00:00'))
                    if not timezone.is_aware(data_fim):
                        data_fim = timezone.make_aware(data_fim)
                    aluguel.data_fim = data_fim
                else:
                    aluguel.data_fim = None
            
            # Update other fields
            if 'valor_total' in data:
                aluguel.valor_total = Decimal(str(data['valor_total'])) if data['valor_total'] else None
            if 'status' in data:
                old_status = aluguel.status
                aluguel.status = data['status']
                
                # Update equipment status based on rental status
                if aluguel.status in ['fechado', 'cancelado'] and old_status in ['aberto', 'em_andamento']:
                    aluguel.equipamento.status = 'disponivel'
                    aluguel.equipamento.save()
                elif aluguel.status in ['aberto', 'em_andamento'] and old_status in ['fechado', 'cancelado']:
                    aluguel.equipamento.status = 'alugado'
                    aluguel.equipamento.save()
                    
            if 'observacoes' in data:
                aluguel.observacoes = data['observacoes']
            
            aluguel.save()
            
            return JsonResponse({
                'id': aluguel.id,
                'cliente': {
                    'id': aluguel.cliente.id,
                    'nome': aluguel.cliente.nome
                },
                'equipamento': {
                    'id': aluguel.equipamento.id,
                    'nome': aluguel.equipamento.nome
                },
                'data_inicio': aluguel.data_inicio.isoformat(),
                'data_fim': aluguel.data_fim.isoformat() if aluguel.data_fim else None,
                'valor_total': str(aluguel.valor_total) if aluguel.valor_total else None,
                'status': aluguel.status,
                'observacoes': aluguel.observacoes,
                'created_at': aluguel.created_at.isoformat(),
                'updated_at': aluguel.updated_at.isoformat()
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        # Set equipment back to available when deleting rental
        if aluguel.status in ['aberto', 'em_andamento']:
            aluguel.equipamento.status = 'disponivel'
            aluguel.equipamento.save()
        
        aluguel.delete()
        return JsonResponse({'message': 'Aluguel deletado com sucesso'}, status=204)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
@staff_member_required
def close_aluguel_api(request, aluguel_id):
    """Quick action to close a rental"""
    aluguel = get_object_or_404(Aluguel, id=aluguel_id)
    
    try:
        data = json.loads(request.body)
        auto_closed = data.get('auto_closed', False)
        
        # Only set end date if it's provided in the request and rental doesn't have one
        if 'data_fim' in data and data['data_fim']:
            data_fim = timezone.datetime.fromisoformat(data['data_fim'].replace('Z', '+00:00'))
            if not timezone.is_aware(data_fim):
                data_fim = timezone.make_aware(data_fim)
            aluguel.data_fim = data_fim
        elif not aluguel.data_fim:
            # If auto_closed and rental has an end date, use that date for calculation
            if auto_closed and aluguel.data_fim:
                pass  # Keep existing end date
            else:
                # Only set to now if no data_fim exists
                aluguel.data_fim = timezone.now()
        
        # Set status to closed
        aluguel.status = 'fechado'
        
        # Calculate total if not set and we have an end date
        if not aluguel.valor_total and aluguel.data_fim:
            horas = (aluguel.data_fim - aluguel.data_inicio).total_seconds() / 3600
            aluguel.valor_total = aluguel.equipamento.valor_por_hora * Decimal(str(horas))
        
        # Add note if auto-closed
        if auto_closed:
            current_obs = aluguel.observacoes or ''
            auto_note = f"\n[FECHADO AUTOMATICAMENTE EM {timezone.now().strftime('%d/%m/%Y %H:%M')} - Data final atingida]"
            aluguel.observacoes = current_obs + auto_note
        
        aluguel.save()
        
        # Set equipment back to available
        aluguel.equipamento.status = 'disponivel'
        aluguel.equipamento.save()
        
        return JsonResponse({
            'id': aluguel.id,
            'cliente': {
                'id': aluguel.cliente.id,
                'nome': aluguel.cliente.nome
            },
            'equipamento': {
                'id': aluguel.equipamento.id,
                'nome': aluguel.equipamento.nome
            },
            'data_inicio': aluguel.data_inicio.isoformat(),
            'data_fim': aluguel.data_fim.isoformat() if aluguel.data_fim else None,
            'valor_total': str(aluguel.valor_total) if aluguel.valor_total else None,
            'status': aluguel.status,
            'observacoes': aluguel.observacoes,
            'created_at': aluguel.created_at.isoformat(),
            'updated_at': aluguel.updated_at.isoformat()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
@staff_member_required
def check_expired_rentals_api(request):
    """API endpoint to check and close expired rentals"""
    try:
        now = timezone.now()
        expired_rentals = Aluguel.objects.filter(
            status__in=['aberto', 'em_andamento'],
            data_fim__lt=now
        )
        
        closed_count = 0
        for rental in expired_rentals:
            # Close the rental
            rental.status = 'fechado'
            
            # Calculate total if not set
            if not rental.valor_total:
                horas = (rental.data_fim - rental.data_inicio).total_seconds() / 3600
                rental.valor_total = rental.equipamento.valor_por_hora * Decimal(str(horas))
            
            # Add auto-close note
            current_obs = rental.observacoes or ''
            auto_note = f"\n[FECHADO AUTOMATICAMENTE EM {now.strftime('%d/%m/%Y %H:%M')} - Data final atingida]"
            rental.observacoes = current_obs + auto_note
            
            rental.save()
            
            # Set equipment back to available
            rental.equipamento.status = 'disponivel'
            rental.equipamento.save()
            
            closed_count += 1
        
        return JsonResponse({
            'closed_count': closed_count,
            'message': f'{closed_count} aluguel(éis) foram fechados automaticamente'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["GET"])
@login_required
@staff_member_required
def dashboard_stats_api(request):
    """API endpoint to get dashboard statistics"""
    try:
        now = timezone.now()
        current_month = now.month
        current_year = now.year
        
        # Aluguéis ativos (status aberto ou em_andamento)
        active_rentals = Aluguel.objects.filter(
            status__in=['aberto', 'em_andamento']
        ).count()
        
        # Receita do mês (apenas aluguéis fechados no mês atual)
        monthly_revenue = Aluguel.objects.filter(
            status='fechado',
            updated_at__month=current_month,
            updated_at__year=current_year,
            valor_total__isnull=False
        ).aggregate(total=Sum('valor_total'))['total'] or Decimal('0')
        
        # Equipamentos disponíveis
        available_equipment = Equipamento.objects.filter(
            status='disponivel'
        ).count()
        
        # Aluguéis recentes (últimos 5)
        from datetime import timedelta
        recent_rentals = []
        for aluguel in Aluguel.objects.select_related('cliente', 'equipamento').order_by('-created_at')[:5]:
            # Converter para UTC-3 (horário de Brasília)
            data_inicio_local = aluguel.data_inicio - timedelta(hours=3)
            recent_rentals.append({
                'id': aluguel.id,
                'cliente_nome': aluguel.cliente.nome,
                'equipamento_nome': aluguel.equipamento.nome,
                'data_inicio': data_inicio_local.strftime('%d/%m/%Y %H:%M'),
                'status': aluguel.get_status_display(),
                'valor_total': str(aluguel.valor_total) if aluguel.valor_total else 'N/A'
            })
        
        # Equipamentos por status
        equipment_stats = {}
        for status_choice in Equipamento.STATUS_CHOICES:
            status_key = status_choice[0]
            status_label = status_choice[1]
            count = Equipamento.objects.filter(status=status_key).count()
            equipment_stats[status_key] = {
                'label': status_label,
                'count': count
            }
        
        return JsonResponse({
            'active_rentals': active_rentals,
            'monthly_revenue': str(monthly_revenue),
            'available_equipment': available_equipment,
            'recent_rentals': recent_rentals,
            'equipment_stats': equipment_stats
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)