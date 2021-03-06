package routers

import (
	"net/http"
	"net/url"

	"github.com/gorilla/mux"
	"github.com/sensu/sensu-go/backend/apid/actions"
	"github.com/sensu/sensu-go/backend/store"
	"github.com/sensu/sensu-go/types"
)

// RolesRouter handles requests for /checks
type RolesRouter struct {
	controller actions.RoleController
}

// NewRolesRouter instantiates new router for controlling check resources
func NewRolesRouter(store store.RBACStore) *RolesRouter {
	return &RolesRouter{
		controller: actions.NewRoleController(store),
	}
}

// Mount the RolesRouter to a parent Router
func (r *RolesRouter) Mount(parent *mux.Router) {
	routes := ResourceRoute{Router: parent, PathPrefix: "/rbac/roles"}
	routes.GetAll(r.list)
	routes.Get(r.find)
	routes.Post(r.create)
	routes.Del(r.destroy)
	routes.Put(r.createOrReplace)

	// Custom
	routes.Path("{id}/rules/{type}", r.addRule).Methods(http.MethodPut)
	routes.Path("{id}/rules/{type}", r.rmRule).Methods(http.MethodDelete)
}

func (r *RolesRouter) list(req *http.Request) (interface{}, error) {
	records, err := r.controller.Query(req.Context())
	return records, err
}

func (r *RolesRouter) find(req *http.Request) (interface{}, error) {
	params := mux.Vars(req)
	id, err := url.PathUnescape(params["id"])
	if err != nil {
		return nil, err
	}
	record, err := r.controller.Find(req.Context(), id)
	return record, err
}

func (r *RolesRouter) create(req *http.Request) (interface{}, error) {
	cfg := types.Role{}
	if err := UnmarshalBody(req, &cfg); err != nil {
		return nil, err
	}

	err := r.controller.Create(req.Context(), cfg)
	return cfg, err
}

func (r *RolesRouter) createOrReplace(req *http.Request) (interface{}, error) {
	cfg := types.Role{}
	if err := UnmarshalBody(req, &cfg); err != nil {
		return nil, err
	}

	err := r.controller.CreateOrReplace(req.Context(), cfg)
	return cfg, err
}

func (r *RolesRouter) destroy(req *http.Request) (interface{}, error) {
	params := mux.Vars(req)
	id, err := url.PathUnescape(params["id"])
	if err != nil {
		return nil, err
	}
	err = r.controller.Destroy(req.Context(), id)
	return nil, err
}

func (r *RolesRouter) addRule(req *http.Request) (interface{}, error) {
	cfg := types.Rule{}
	if err := UnmarshalBody(req, &cfg); err != nil {
		return nil, err
	}

	params := mux.Vars(req)
	id, err := url.PathUnescape(params["id"])
	if err != nil {
		return nil, err
	}
	err = r.controller.AddRule(req.Context(), id, cfg)

	return nil, err
}

func (r *RolesRouter) rmRule(req *http.Request) (interface{}, error) {
	params := mux.Vars(req)
	id, err := url.PathUnescape(params["id"])
	if err != nil {
		return nil, err
	}
	typ, err := url.PathUnescape(params["type"])
	if err != nil {
		return nil, err
	}
	err = r.controller.RemoveRule(req.Context(), id, typ)
	return nil, err
}
