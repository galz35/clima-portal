IF OBJECT_ID('dbo.p_ProyectoSolicitudesAprobacion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.p_ProyectoSolicitudesAprobacion (
        idSolicitudProyecto INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        idProyecto INT NOT NULL,
        idUsuarioSolicitante INT NOT NULL,
        motivo NVARCHAR(MAX) NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_ProyectoSolicitudesAprobacion_Estado DEFAULT ('Pendiente'),
        fechaSolicitud DATETIME NOT NULL CONSTRAINT DF_ProyectoSolicitudesAprobacion_FechaSolicitud DEFAULT (GETDATE()),
        fechaResolucion DATETIME NULL,
        idUsuarioResolutor INT NULL,
        comentarioResolucion NVARCHAR(MAX) NULL,
        CONSTRAINT FK_ProyectoSolicitudesAprobacion_Proyecto FOREIGN KEY (idProyecto) REFERENCES dbo.p_Proyectos(idProyecto),
        CONSTRAINT FK_ProyectoSolicitudesAprobacion_Solicitante FOREIGN KEY (idUsuarioSolicitante) REFERENCES dbo.p_Usuarios(idUsuario),
        CONSTRAINT FK_ProyectoSolicitudesAprobacion_Resolutor FOREIGN KEY (idUsuarioResolutor) REFERENCES dbo.p_Usuarios(idUsuario),
        CONSTRAINT CK_ProyectoSolicitudesAprobacion_Estado CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado'))
    );

    CREATE UNIQUE INDEX UX_ProyectoSolicitudesAprobacion_Pendiente
        ON dbo.p_ProyectoSolicitudesAprobacion (idProyecto)
        WHERE estado = 'Pendiente';
END
GO
