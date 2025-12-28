from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
import os

def frontend_view(request):
    """Servir le frontend React depuis Django"""
    return render(request, 'index.html')

def catch_all_view(request, path=''):
    """Catch-all pour les routes React Router"""
    return render(request, 'index.html')